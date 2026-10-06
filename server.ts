import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { wikidataImageService } from './src/services/wikidataImageService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// =============================================================================
// Real-time Multi-Device Screen Synchronization (TV Display <-> Host Controller)
// =============================================================================
const sseClients: express.Response[] = [];

app.get('/api/sync/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.push(res);

  // Keep alive ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

app.post('/api/sync/action', (req, res) => {
  const action = req.body;
  if (!action || !action.type) {
    return res.status(400).json({ error: 'Invalid action payload' });
  }

  const payload = `data: ${JSON.stringify(action)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {}
  });

  return res.json({ ok: true, recipientCount: sseClients.length });
});

// Helper to get GoogleGenAI client
function getGenAI() {
  let apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  // Strip accidental outer quotes if added in Docker/Portainer env inputs (e.g. "AQ.Ab8..." or 'AQ.Ab8...')
  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1).trim();
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// =============================================================================
// Wikidata Structured-Data Image Pipeline (10/10 Accuracy)
// =============================================================================
interface PhotoLookupResult {
  url: string;
  alt: string;
  source: string;
  entityId?: string;
  filename?: string;
  property?: 'P18' | 'P154';
}

async function fetchRealPhoto(rawQuery?: string | null): Promise<PhotoLookupResult | null> {
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return null;
  }
  const cleanQuery = rawQuery.trim().replace(/^["'`]|["'`]$/g, '');
  if (!cleanQuery) return null;

  try {
    const wikiData = await wikidataImageService.getImageForTopic(cleanQuery, 800);
    if (wikiData) {
      return {
        url: wikiData.url,
        alt: wikiData.entityLabel || cleanQuery,
        source: `Wikidata (${wikiData.entityId})`,
        entityId: wikiData.entityId,
        filename: wikiData.filename,
        property: wikiData.property,
      };
    }
  } catch (err) {
    console.warn(`[Wikidata] Pipeline error for "${cleanQuery}":`, (err as Error)?.message || err);
  }

  return null;
}

// Checks if an image query or filename directly spoils the answer in plaintext
function isSpoilerMatch(query: string, answer: string, filename?: string): boolean {
  if (!query || !answer) return false;
  
  const cleanAnswer = answer
    .toLowerCase()
    .replace(/^(who is|what is|where is|when is)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  const cleanQuery = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();

  // If query is directly identical to the core answer, it spoils the challenge
  if (cleanQuery.length > 2 && cleanQuery === cleanAnswer) {
    return true;
  }

  // If filename contains words like logo/title/wordmark, reject
  if (filename) {
    const cleanFn = filename.toLowerCase();
    if (/(logo|title_screen|title_card|wordmark|dvd_cover|poster)/i.test(cleanFn)) {
      return true;
    }
    // If filename explicitly includes the full show/character name from the answer alongside 'title'
    if (cleanAnswer.length > 3 && cleanFn.includes(cleanAnswer.replace(/\s+/g, '_'))) {
      return true;
    }
  }

  return false;
}

// Enriches a full board with real canonical photos concurrently
async function enrichBoardWithImages(board: any) {
  if (!board || !Array.isArray(board.categories)) return board;

  const tasks: Promise<void>[] = [];

  for (const cat of board.categories) {
    if (Array.isArray(cat.clues)) {
      for (const clue of cat.clues) {
        const query = clue.image_search_query || (clue.image && !clue.image.startsWith('/') && !clue.image.startsWith('http') ? clue.image : null);
        if (query) {
          if (isSpoilerMatch(query, clue.answer)) {
            console.warn(`[Anti-Spoiler] Discarded spoiler query "${query}" for answer "${clue.answer}"`);
            clue.image = null;
            clue.image_search_query = null;
            continue;
          }
          tasks.push(
            fetchRealPhoto(query).then((photo) => {
              if (photo && !isSpoilerMatch(query, clue.answer, photo.filename)) {
                clue.image = photo.url;
                clue.imageAlt = 'Visual Clue';
                clue.imageSource = photo.source;
              } else {
                clue.image = null;
                clue.image_search_query = null;
              }
            })
          );
        }
      }
    }
  }

  const finalQuery = board.finalJeopardy?.image_search_query || (board.finalJeopardy?.image && !board.finalJeopardy.image.startsWith('/') && !board.finalJeopardy.image.startsWith('http') ? board.finalJeopardy.image : null);
  if (finalQuery && board.finalJeopardy) {
    if (isSpoilerMatch(finalQuery, board.finalJeopardy.answer)) {
      console.warn(`[Anti-Spoiler] Discarded spoiler query for final jeopardy`);
      board.finalJeopardy.image = null;
      board.finalJeopardy.image_search_query = null;
    } else {
      tasks.push(
        fetchRealPhoto(finalQuery).then((photo) => {
          if (photo && !isSpoilerMatch(finalQuery, board.finalJeopardy.answer, photo.filename)) {
            board.finalJeopardy.image = photo.url;
            board.finalJeopardy.imageAlt = 'Final Clue Image';
            board.finalJeopardy.imageSource = photo.source;
          } else {
            board.finalJeopardy.image = null;
            board.finalJeopardy.image_search_query = null;
          }
        })
      );
    }
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }

  return board;
}

// Enriches a single category with real canonical photos
async function enrichCategoryWithImages(category: any) {
  if (!category || !Array.isArray(category.clues)) return category;

  const tasks: Promise<void>[] = [];
  for (const clue of category.clues) {
    const query = clue.image_search_query || (clue.image && !clue.image.startsWith('/') && !clue.image.startsWith('http') ? clue.image : null);
    if (query) {
      if (isSpoilerMatch(query, clue.answer)) {
        clue.image = null;
        clue.image_search_query = null;
        continue;
      }
      tasks.push(
        fetchRealPhoto(query).then((photo) => {
          if (photo && !isSpoilerMatch(query, clue.answer, photo.filename)) {
            clue.image = photo.url;
            clue.imageAlt = 'Visual Clue';
            clue.imageSource = photo.source;
          } else {
            clue.image = null;
            clue.image_search_query = null;
          }
        })
      );
    }
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }

  return category;
}

// Standalone Wikidata structured image lookup endpoint
app.get('/api/images/lookup', async (req, res) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }
  const result = await wikidataImageService.getImageForTopic(query, 800);
  if (!result) {
    return res.status(404).json({ error: 'No canonical Wikidata image claim (P18/P154) found for this topic' });
  }
  return res.json(result);
});

// =============================================================================
// API: Generate Full Anime Jeopardy Board (6 Categories x 5 Clues + Final)
// =============================================================================
app.post('/api/ai/generate-board', async (req, res) => {
  const { theme, difficulty = 'Family Friendly', customInstructions } = req.body;

  const ai = getGenAI();
  if (!ai) {
    console.warn('GEMINI_API_KEY missing. Cannot generate AI trivia board.');
    return res.status(400).json({
      error: 'GEMINI_API_KEY is not configured in the server environment. Fresh AI questions cannot be generated without an active Gemini API key.',
      reason: 'missing_api_key'
    });
  }

  const prompt = `You are an elite Jeopardy question writer and trivia champion.
Create a complete, authentic 6-category Jeopardy game board based on the theme: "${theme || 'Popular Anime Favorites'}".
Target Audience / Difficulty: "${difficulty}".
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Strict Rules:
1. Exactly 6 creative categories. Each category must have exactly 5 clues with values $200, $400, $600, $800, and $1000 in strictly ascending difficulty.
2. Clues must be written in traditional Jeopardy clue phrasing (e.g. "This rubber-bodied captain...", "This sacred volcano...", "In this 1997 film...").
3. Answers must be phrased as questions: "Who is [Character]?" or "What is [Object/Place/Power]?"
4. Designate 1 or 2 clues total as isDailyDouble: true (usually on a $600 or $800 clue).
5. CRITICAL VISUAL HINT RULE (CLEVER IN-UNIVERSE HINTS ONLY - NEVER PLAINTEXT SPOILERS):
   The image must be a clever Jeopardy PUZZLE HINT or in-universe artifact, NEVER the answer in plaintext!
   - 🚫 NEVER show logos, title cards, covers, posters, or graphics that spell out the answer in text.
   - 🚫 NEVER put the exact answer entity in "image_search_query" if the question asks players to name them!
     (e.g., if the answer is "Who is Monkey D. Luffy?", DO NOT show Luffy himself; if the answer is "What is Death Note?", DO NOT show the Death Note title).
   - ✅ INSTEAD: In "image_search_query", choose a recognizable in-universe item, weapon, vehicle, symbolic prop, creature, or distinct cultural artifact:
     * Question asks about Death Note ➔ Hint: "Red apple" or "Fountain pen"
     * Question asks about Monkey D. Luffy ➔ Hint: "Straw hat" or "Going Merry"
     * Question asks about Evangelion ➔ Hint: "Spear of Longinus" or "Cassette player"
     * Question asks about Dragon Ball ➔ Hint: "Dragon Radar" or "Flying Nimbus" or "Turtle shell"
     * Question asks about Naruto ➔ Hint: "Ramen" or "Headband with metal plate"
     * Question asks about Attack on Titan ➔ Hint: "Wings of Freedom" or "Omni-directional mobility gear"
     * Question asks about Demon Slayer ➔ Hint: "Hanafuda earrings" or "Bamboo muzzle"
     * Question asks about Studio Ghibli ➔ Hint: "Catbus" or "Acorn"
     * Question asks about an author/director ➔ Hint: An iconic artifact from their show, NOT the author's portrait or name.
   - Limit images to 1 or 2 clues per category where a clever visual hint fits naturally. Otherwise set "image_search_query": null.
6. Provide one high-stakes Final Jeopardy with a category, clue, answer, and optional subtle in-universe item hint in "image_search_query".`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subtitle: { type: Type.STRING },
      categories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            clues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  value: { type: Type.INTEGER },
                  clue: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  isDailyDouble: { type: Type.BOOLEAN },
                  image_search_query: { type: Type.STRING, nullable: true },
                  image: { type: Type.STRING, nullable: true },
                  imageAlt: { type: Type.STRING, nullable: true },
                },
                required: ['value', 'clue', 'answer'],
              },
            },
          },
          required: ['title', 'clues'],
        },
      },
      finalJeopardy: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          clue: { type: Type.STRING },
          answer: { type: Type.STRING },
          image_search_query: { type: Type.STRING, nullable: true },
          image: { type: Type.STRING, nullable: true },
          imageAlt: { type: Type.STRING, nullable: true },
        },
        required: ['category', 'clue', 'answer'],
      },
    },
    required: ['title', 'categories', 'finalJeopardy'],
  };

  // Models to attempt in sequence: gemini-3.1-flash-lite (Ultra-fast, high capacity) -> gemini-3.8-flash (Standard model)
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastErrorMsg = '';

  for (const model of candidateModels) {
    try {
      console.log(`Attempting board generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        let data = JSON.parse(text);
        // Automatically fetch real photos for any image_search_query via Wikimedia / Wikipedia / Unsplash
        data = await enrichBoardWithImages(data);
        return res.json({
          ...data,
          source: model
        });
      }
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      console.warn(`Model ${model} attempt failed: ${errMsg}`);
      lastErrorMsg = errMsg;

      // Wait 750ms before next candidate model
      await new Promise(resolve => setTimeout(resolve, 750));
    }
  }

  // Do not default to instant board or fallback questions; return descriptive explanation of why it failed
  let detailedExplanation = 'Unable to generate fresh questions with Gemini AI.';
  if (lastErrorMsg.includes('429') || lastErrorMsg.includes('RESOURCE_EXHAUSTED')) {
    detailedExplanation = 'Gemini API rate limit or quota exceeded (429 Resource Exhausted). The API received too many requests in a short duration.';
  } else if (lastErrorMsg.includes('503') || lastErrorMsg.includes('UNAVAILABLE') || lastErrorMsg.includes('high demand')) {
    detailedExplanation = 'Google Gemini servers are currently experiencing temporary high demand (503 Service Unavailable). Please try again shortly.';
  } else if (lastErrorMsg.includes('403') || lastErrorMsg.includes('401') || lastErrorMsg.includes('API_KEY_INVALID') || lastErrorMsg.includes('API key not valid')) {
    detailedExplanation = 'Gemini API authentication failed: the provided API key is invalid, inactive, or unauthorized.';
  } else if (lastErrorMsg.includes('SAFETY') || lastErrorMsg.includes('blocked')) {
    detailedExplanation = 'The requested theme was blocked by Gemini content safety filters.';
  } else if (lastErrorMsg) {
    detailedExplanation = `AI question generation failed: ${lastErrorMsg}`;
  }

  return res.status(502).json({
    error: detailedExplanation,
    rawError: lastErrorMsg,
    attemptedModels: candidateModels
  });
});

// =============================================================================
// API: Generate a Single Category (5 Clues from $200 to $1000)
// =============================================================================
app.post('/api/ai/generate-category', async (req, res) => {
  const { topic, difficulty = 'Family Friendly' } = req.body;

  const ai = getGenAI();
  if (!ai) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
  }

  const prompt = `Write a single Jeopardy category with 5 clues about: "${topic || 'Iconic Anime Battles'}".
Difficulty: "${difficulty}".
Clues must escalate from $200 (easiest) to $1000 (toughest).
Clues must be written in Jeopardy clue format, and answers must be phrased as questions ("Who is...?", "What is...?").
VISUAL HINT RULE: Images must be subtle in-universe artifacts or puzzle hints, NEVER direct answer spoilers or title logos in plaintext!
For example: if the answer is a show/creator/character, provide an iconic item (e.g. 'Straw hat', 'Dragon Radar', 'Kunai', 'Red apple', 'Catbus', 'Spear of Longinus') in "image_search_query". NEVER show logos, covers, or the answer itself in text. Otherwise set to null.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      clues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            value: { type: Type.INTEGER },
            clue: { type: Type.STRING },
            answer: { type: Type.STRING },
            isDailyDouble: { type: Type.BOOLEAN },
            image_search_query: { type: Type.STRING, nullable: true },
            image: { type: Type.STRING, nullable: true },
            imageAlt: { type: Type.STRING, nullable: true },
          },
          required: ['value', 'clue', 'answer'],
        },
      },
    },
    required: ['title', 'clues'],
  };

  // Models to attempt in sequence: gemini-3.1-flash-lite -> gemini-3.8-flash
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  let lastCategoryError = '';

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        let data = JSON.parse(text);
        data = await enrichCategoryWithImages(data);
        return res.json(data);
      }
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      console.warn(`Category generation with ${model} failed: ${errMsg}`);
      lastCategoryError = errMsg;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Do not default to hardcoded clues; return explanation
  return res.status(502).json({
    error: `Could not generate category "${topic || 'Anime'}": ${lastCategoryError || 'Model returned empty response.'}`,
    rawError: lastCategoryError
  });
});

// =============================================================================
// API: Generate Family Feud Survey Board (5 Survey Rounds + Fast Money)
// =============================================================================
app.post('/api/ai/generate-feud', async (req, res) => {
  const { topic = 'Popular Anime & Manga', customInstructions } = req.body;

  const ai = getGenAI();
  if (!ai) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY is not configured in the server environment.',
      reason: 'missing_api_key'
    });
  }

  const prompt = `You are an elite television game-show writer for Family Feud.
Create a complete, authentic 5-round Family Feud survey game plus a 5-question Fast Money bonus round on the theme: "${topic}".
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Strict Rules:
1. Exactly 5 Main Rounds:
   - Round 1 (1x Multiplier): 6 ranked answers.
   - Round 2 (1x Multiplier): 6 ranked answers.
   - Round 3 (2x Multiplier - DOUBLE POINTS): 5 or 6 ranked answers.
   - Round 4 (2x Multiplier - DOUBLE POINTS): 5 or 6 ranked answers.
   - Round 5 (3x Multiplier - TRIPLE POINTS): 5 or 6 ranked answers.
   - Questions must be phrased in classic survey style: "We asked 100 people: Name..."
   - Points for each answer must be positive integers in descending order, summing up to approximately 95-100 total points per round.
2. Fast Money Bonus:
   - Exactly 5 rapid-fire questions.
   - Each question has top 3 to 5 survey answers with points summing to ~100.
3. Keep answers clean, punchy, and instantly recognizable on television.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subtitle: { type: Type.STRING },
      theme: { type: Type.STRING },
      rounds: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            multiplier: { type: Type.INTEGER },
            answers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  points: { type: Type.INTEGER },
                },
                required: ['id', 'text', 'points']
              }
            }
          },
          required: ['id', 'question', 'multiplier', 'answers']
        }
      },
      fastMoney: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            answers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  points: { type: Type.INTEGER }
                },
                required: ['text', 'points']
              }
            }
          },
          required: ['id', 'question', 'answers']
        }
      }
    },
    required: ['title', 'theme', 'rounds', 'fastMoney']
  };

  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastFeudError = '';

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const data = JSON.parse(text);
        data.id = `feud-ai-${Date.now()}`;
        return res.json(data);
      }
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      console.warn(`Feud generation with ${model} failed: ${errMsg}`);
      lastFeudError = errMsg;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return res.status(502).json({
    error: `Could not generate Family Feud set for "${topic}": ${lastFeudError || 'Model returned empty response.'}`,
    rawError: lastFeudError
  });
});

// =============================================================================
// Mount Vite middlewares in development or serve dist in production
// =============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Family Jeopardy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
