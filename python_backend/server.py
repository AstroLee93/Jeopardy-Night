"""
Family Jeopardy - Full Python FastAPI Backend
Using official google-genai Python SDK and Wikidata structured-data pipeline.
"""

import os
import re
import json
import asyncio
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
from google.genai import types

from wikidata_service import wikidata_service, WikidataImageResult

load_dotenv()

app = FastAPI(title="Family Jeopardy Backend (Python / google-genai)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared in-memory game synchronization state for multi-screen TV/phone play
game_sync_state: Dict[str, Any] = {
    "currentClueId": None,
    "activeCategory": None,
    "activeValue": None,
    "isAnswerRevealed": False,
    "buzzerLocked": False,
    "buzzedTeam": None,
    "timerSeconds": 15,
    "isDailyDoubleActive": False,
    "isFinalJeopardyActive": False,
    "scores": {},
    "lastActionTimestamp": 0,
}


def get_genai_client() -> Optional[genai.Client]:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    # Strip any accidental outer quotes from Docker/Portainer environment values
    if (api_key.startswith('"') and api_key.endswith('"')) or (api_key.startswith("'") and api_key.endswith("'")):
        api_key = api_key[1:-1].strip()
    return genai.Client(api_key=api_key)


def is_spoiler_match(query: str, answer: str, filename: Optional[str] = None) -> bool:
    """Checks if an image query or retrieved filename gives away the answer in plaintext."""
    if not query or not answer:
        return False

    clean_ans = re.sub(r'^(who is|what is|where is|when is)\s+', '', answer, flags=re.IGNORECASE)
    clean_ans = re.sub(r'[^\w\s]', '', clean_ans).strip().lower()
    clean_q = re.sub(r'[^\w\s]', '', query).strip().lower()

    if len(clean_q) > 2 and clean_q == clean_ans:
        return True

    if filename:
        fn_lower = filename.lower()
        if bool(re.search(r'(logo|title_screen|title_card|wordmark|dvd_cover|poster)', fn_lower)):
            return True
        if len(clean_ans) > 3 and clean_ans.replace(' ', '_') in fn_lower:
            return True

    return False


async def enrich_clue_with_image(clue: Dict[str, Any]) -> None:
    query = clue.get("image_search_query") or clue.get("image")
    if not query or query.startswith("/") or query.startswith("http"):
        return

    ans = clue.get("answer", "")
    if is_spoiler_match(query, ans):
        clue["image"] = None
        clue["image_search_query"] = None
        return

    photo = await wikidata_service.get_image_for_topic(query)
    if photo and not is_spoiler_match(query, ans, photo.filename):
        clue["image"] = photo.url
        clue["imageAlt"] = "Visual Clue"
        clue["imageSource"] = photo.source
    else:
        clue["image"] = None
        clue["image_search_query"] = None


async def enrich_board(board: Dict[str, Any]) -> Dict[str, Any]:
    tasks = []
    for cat in board.get("categories", []):
        for clue in cat.get("clues", []):
            tasks.append(enrich_clue_with_image(clue))

    fj = board.get("finalJeopardy")
    if fj:
        tasks.append(enrich_clue_with_image(fj))

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
    return board


# ==============================================================================
# API Endpoints
# ==============================================================================

class GenerateBoardRequest(BaseModel):
    theme: Optional[str] = "Popular Anime Favorites"
    difficulty: Optional[str] = "Family Friendly"
    customInstructions: Optional[str] = None


@app.post("/api/ai/generate-board")
async def generate_board(req: GenerateBoardRequest):
    client = get_genai_client()
    if not client:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is not configured in the server environment."
        )

    prompt = f"""You are an elite Jeopardy question writer and trivia champion.
Create a complete, authentic 6-category Jeopardy game board based on the theme: "{req.theme}".
Target Audience / Difficulty: "{req.difficulty}".
{f"Special Instructions: {req.customInstructions}" if req.customInstructions else ""}

Strict Rules:
1. Exactly 6 creative categories. Each category must have exactly 5 clues with values $200, $400, $600, $800, and $1000 in strictly ascending difficulty.
2. Clues must be written in traditional Jeopardy clue phrasing (e.g. "This rubber-bodied captain...", "This sacred volcano...", "In this 1997 film...").
3. Answers must be phrased as questions: "Who is [Character]?" or "What is [Object/Place/Power]?"
4. Designate 1 or 2 clues total as isDailyDouble: true (usually on a $600 or $800 clue).
5. CRITICAL VISUAL HINT RULE (CLEVER IN-UNIVERSE HINTS ONLY - NEVER PLAINTEXT SPOILERS):
   The image must be a clever Jeopardy PUZZLE HINT or in-universe artifact, NEVER the answer in plaintext!
   - NEVER show logos, title cards, covers, posters, or graphics that spell out the answer in text.
   - NEVER put the exact answer entity in "image_search_query" if the question asks players to name them!
     (e.g., if the answer is "Who is Monkey D. Luffy?", DO NOT show Luffy himself; if the answer is "What is Death Note?", DO NOT show the Death Note title).
   - INSTEAD: In "image_search_query", choose a recognizable in-universe item, weapon, vehicle, symbolic prop, creature, or distinct cultural artifact:
     * Question asks about Death Note -> Hint: "Red apple" or "Fountain pen"
     * Question asks about Monkey D. Luffy -> Hint: "Straw hat" or "Going Merry"
     * Question asks about Evangelion -> Hint: "Spear of Longinus" or "Cassette player"
     * Question asks about Dragon Ball -> Hint: "Dragon Radar" or "Flying Nimbus" or "Turtle shell"
     * Question asks about Naruto -> Hint: "Ramen" or "Headband with metal plate"
     * Question asks about Attack on Titan -> Hint: "Wings of Freedom" or "Omni-directional mobility gear"
     * Question asks about Demon Slayer -> Hint: "Hanafuda earrings" or "Bamboo muzzle"
     * Question asks about Studio Ghibli -> Hint: "Catbus" or "Acorn"
   - Limit images to 1 or 2 clues per category where a clever visual hint fits naturally. Otherwise set "image_search_query": null.
6. Provide one high-stakes Final Jeopardy with a category, clue, answer, and optional subtle in-universe item hint in "image_search_query".
"""

    candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    last_err = ""

    for model in candidate_models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            raw_text = response.text.strip() if response.text else ""
            if raw_text:
                data = json.loads(raw_text)
                enriched = await enrich_board(data)
                return enriched
        except Exception as e:
            last_err = str(e)
            print(f"[Gemini Python] Model {model} failed: {e}")
            await asyncio.sleep(0.5)

    raise HTTPException(status_code=502, detail=f"AI board generation failed: {last_err}")


class GenerateCategoryRequest(BaseModel):
    topic: Optional[str] = "Iconic Anime Battles"
    difficulty: Optional[str] = "Family Friendly"


@app.post("/api/ai/generate-category")
async def generate_category(req: GenerateCategoryRequest):
    client = get_genai_client()
    if not client:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is not configured.")

    prompt = f"""Write a single Jeopardy category with 5 clues about: "{req.topic}".
Difficulty: "{req.difficulty}".
Clues must escalate from $200 (easiest) to $1000 (toughest).
Clues must be written in Jeopardy clue format, and answers must be phrased as questions ("Who is...?", "What is...?").
VISUAL HINT RULE: Images must be subtle in-universe artifacts or puzzle hints, NEVER direct answer spoilers or title logos in plaintext!
For example: if the answer is a show/creator/character, provide an iconic item (e.g. 'Straw hat', 'Dragon Radar', 'Kunai', 'Red apple', 'Catbus') in "image_search_query". Otherwise set to null.
Output clean JSON with title, description, and clues array.
"""

    candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    for model in candidate_models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            if response.text:
                data = json.loads(response.text.strip())
                for clue in data.get("clues", []):
                    await enrich_clue_with_image(clue)
                return data
        except Exception as e:
            print(f"[Gemini Python Category] Model {model} failed: {e}")

    raise HTTPException(status_code=502, detail="Category generation failed.")


@app.get("/api/images/lookup")
async def lookup_image(query: str = Query(..., description="Entity topic name")):
    result = await wikidata_service.get_image_for_topic(query)
    if not result:
        raise HTTPException(status_code=404, detail="No canonical image claim found.")
    return result


# ==============================================================================
# Screen Synchronization & Buzzer State API
# ==============================================================================

@app.get("/api/sync/state")
async def get_sync_state():
    return game_sync_state


@app.post("/api/sync/update")
async def update_sync_state(req: Request):
    data = await req.json()
    game_sync_state.update(data)
    game_sync_state["lastActionTimestamp"] = int(asyncio.get_event_loop().time() * 1000)
    return {"status": "ok", "state": game_sync_state}


@app.post("/api/sync/buzz")
async def register_buzz(req: Request):
    data = await req.json()
    team_name = data.get("teamName")
    if not game_sync_state["buzzerLocked"] and game_sync_state["buzzedTeam"] is None:
        game_sync_state["buzzedTeam"] = team_name
        game_sync_state["buzzerLocked"] = True
        return {"success": True, "buzzedTeam": team_name}
    return {"success": False, "buzzedTeam": game_sync_state["buzzedTeam"]}


@app.post("/api/sync/reset-buzzer")
async def reset_buzzer():
    game_sync_state["buzzerLocked"] = False
    game_sync_state["buzzedTeam"] = None
    return {"status": "ok"}


# Serve static built frontend if 'dist' directory exists (Single-container deployment)
dist_dir = Path(__file__).parent.parent / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3000))
    print(f"Starting Family Jeopardy Python server on http://0.0.0.0:{port}")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
