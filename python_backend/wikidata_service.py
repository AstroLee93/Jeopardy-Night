"""
Wikidata Structured-Data Image Pipeline (Python 3)
3-Step Production Pipeline for 10/10 Canonical Image Accuracy without Spoilers
"""

import re
import urllib.parse
from typing import Optional, Dict, Tuple
from pydantic import BaseModel
import httpx

USER_AGENT = "FamilyJeopardyBot/2.0 (alexcauthen93@gmail.com; Jeopardy Trivia Game; https://aistudio.google.com)"


class WikidataImageResult(BaseModel):
    url: str
    filename: str
    entity_id: str
    entity_label: Optional[str] = None
    property: str
    source: str = "Wikidata"


class WikidataImageService:
    def __init__(self, default_width: int = 800, timeout: float = 4.0):
        self.default_width = default_width
        self.timeout = timeout
        # In-memory caches for rapid retrieval on Raspberry Pi
        self.topic_cache: Dict[str, Optional[WikidataImageResult]] = {}
        self.claim_cache: Dict[str, Optional[Tuple[str, str]]] = {}
        self.entity_cache: Dict[str, Optional[dict]] = {}

    def _normalize_topic(self, topic: str) -> str:
        return re.sub(r'["\'`]', '', topic).strip()

    async def resolve_entity_id(self, client: httpx.AsyncClient, topic: str) -> Optional[dict]:
        clean = self._normalize_topic(topic)
        if not clean:
            return None
        cache_key = clean.lower()
        if cache_key in self.entity_cache:
            return self.entity_cache[cache_key]

        url = "https://www.wikidata.org/w/api.php"
        params = {
            "action": "wbsearchentities",
            "search": clean,
            "language": "en",
            "format": "json",
            "limit": 3
        }
        try:
            resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
            if resp.status_code != 200:
                return None

            data = resp.json()
            results = data.get("search", [])
            if not results:
                self.entity_cache[cache_key] = None
                return None

            # Prioritize exact label match; fall back to top result
            match = next((item for item in results if item.get("label", "").lower() == clean.lower()), results[0])
            entity_info = {
                "id": match["id"],
                "label": match.get("label"),
                "description": match.get("description")
            }
            self.entity_cache[cache_key] = entity_info
            return entity_info
        except Exception as e:
            print(f"[Wikidata] Error resolving '{clean}': {e}")
            return None

    async def fetch_image_claim(self, client: httpx.AsyncClient, entity_id: str, allow_logos: bool = False) -> Optional[Tuple[str, str]]:
        cache_key = f"{entity_id}_{allow_logos}"
        if cache_key in self.claim_cache:
            return self.claim_cache[cache_key]

        url = "https://www.wikidata.org/w/api.php"
        params = {
            "action": "wbgetclaims",
            "entity": entity_id,
            "property": "P18",
            "format": "json"
        }
        try:
            # 1. Fetch Primary Image (P18: authentic depictions, props, artifacts, creatures)
            resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
            if resp.status_code == 200:
                claims = resp.json().get("claims", {}).get("P18", [])
                if claims:
                    val = claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
                    if val and isinstance(val, str):
                        # Anti-spoiler filter: reject files that are wordmarks or title covers
                        is_spoiler = not allow_logos and bool(
                            re.search(r'(logo|wordmark|title_screen|title_card|dvd_cover|poster|title\.)', val, re.IGNORECASE)
                        )
                        if not is_spoiler:
                            result = (val.strip(), "P18")
                            self.claim_cache[cache_key] = result
                            return result

            # 2. Only check P154 (Official Logo) if explicitly permitted (never for trivia clues)
            if allow_logos:
                params["property"] = "P154"
                resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
                if resp.status_code == 200:
                    claims = resp.json().get("claims", {}).get("P154", [])
                    if claims:
                        val = claims[0].get("mainsnak", {}).get("datavalue", {}).get("value")
                        if val and isinstance(val, str):
                            result = (val.strip(), "P154")
                            self.claim_cache[cache_key] = result
                            return result

            self.claim_cache[cache_key] = None
            return None
        except Exception as e:
            print(f"[Wikidata] Error fetching claims for {entity_id}: {e}")
            return None

    def get_canonical_url(self, filename: str, width: int = 800) -> str:
        clean_fn = re.sub(r'^File:', '', filename, flags=re.IGNORECASE).strip()
        encoded = urllib.parse.quote(clean_fn)
        return f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded}?width={width}"

    async def get_image_for_topic(self, topic: str, width: int = 800, allow_logos: bool = False) -> Optional[WikidataImageResult]:
        clean = self._normalize_topic(topic)
        if not clean:
            return None

        cache_key = f"{clean.lower()}_{width}_{allow_logos}"
        if cache_key in self.topic_cache:
            return self.topic_cache[cache_key]

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            entity = await self.resolve_entity_id(client, clean)
            if not entity:
                self.topic_cache[cache_key] = None
                return None

            claim = await self.fetch_image_claim(client, entity["id"], allow_logos=allow_logos)
            if not claim:
                self.topic_cache[cache_key] = None
                return None

            filename, prop = claim
            url = self.get_canonical_url(filename, width)
            res = WikidataImageResult(
                url=url,
                filename=filename,
                entity_id=entity["id"],
                entity_label=entity.get("label"),
                property=prop,
                source=f"Wikidata ({entity['id']})"
            )
            self.topic_cache[cache_key] = res
            return res


wikidata_service = WikidataImageService()
