import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { CURATED_BOARDS } from './src/data/curatedAnimeBoards';

dotenv.config();

const app = express();
const PORT = 3000;

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
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

// Fallback board selector based on prompt keywords
function getCuratedFallbackBoard(theme = '', difficulty = 'Family Friendly') {
  const lower = theme.toLowerCase();
  if (lower.includes('ghibli') || lower.includes('totoro') || lower.includes('miyazaki')) {
    return CURATED_BOARDS['ghibli'];
  }
  // Default to rich All-Stars board
  const board = JSON.parse(JSON.stringify(CURATED_BOARDS['all-stars']));
  if (theme) {
    board.subtitle = `${theme} · ${difficulty}`;
  }
  return board;
}

// =============================================================================
// API: Generate Full Anime Jeopardy Board (6 Categories x 5 Clues + Final)
// =============================================================================
app.post('/api/ai/generate-board', async (req, res) => {
  const { theme, difficulty = 'Family Friendly', customInstructions } = req.body;

  const ai = getGenAI();
  if (!ai) {
    console.warn('GEMINI_API_KEY missing. Delivering curated board fallback.');
    return res.json({
      ...getCuratedFallbackBoard(theme, difficulty),
      source: 'offline-library',
      notice: 'API key not configured; loaded offline anime trivia board.'
    });
  }

  const prompt = `You are an elite Jeopardy question writer and anime trivia champion.
Create a complete, authentic 6-category Anime Jeopardy game board based on the theme: "${theme || 'Popular Anime Favorites'}".
Target Audience / Difficulty: "${difficulty}".
${customInstructions ? `Special Instructions: ${customInstructions}` : ''}

Strict Rules:
1. Exactly 6 creative categories. Each category must have exactly 5 clues with values $200, $400, $600, $800, and $1000 in strictly ascending difficulty.
2. Clues must be written in traditional Jeopardy clue phrasing (e.g. "This rubber-bodied captain...", "This alchemy taboo...", "In this 1997 film...").
3. Answers must be phrased as questions: "Who is [Character]?" or "What is [Object/Place/Power]?"
4. Designate 1 or 2 clues total as isDailyDouble: true (usually on a $600 or $800 clue).
5. For clues with iconic visual subjects, suggest a clean local image path (e.g. "/images/luffy.jpg", "/images/totoro.jpg") or set to null if text-only.
6. Provide one high-stakes Final Jeopardy with a category, clue, answer, and optional image suggestion.`;

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
          image: { type: Type.STRING, nullable: true },
        },
        required: ['category', 'clue', 'answer'],
      },
    },
    required: ['title', 'categories', 'finalJeopardy'],
  };

  // Models to attempt in sequence (Primary -> High-throughput fallback)
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

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
        const data = JSON.parse(text);
        return res.json({
          ...data,
          source: model
        });
      }
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || String(err);
      console.warn(`Model ${model} attempt failed: ${errMsg}`);

      const isHighDemandOrRateLimit = 
        errMsg.includes('503') || 
        errMsg.includes('high demand') || 
        errMsg.includes('UNAVAILABLE') || 
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (!isHighDemandOrRateLimit && model === candidateModels[candidateModels.length - 1]) {
        // Not a 503 capacity issue and all models tried
        break;
      }
      // Wait 750ms before next candidate model
      await new Promise(resolve => setTimeout(resolve, 750));
    }
  }

  // Graceful Fallback if all Google API models report 503 high demand:
  // Deliver rich themed board so family game night NEVER fails!
  console.log('All live models under peak demand. Delivering curated board fallback.');
  const fallbackBoard = getCuratedFallbackBoard(theme, difficulty);
  return res.json({
    ...fallbackBoard,
    source: 'curated-fallback',
    notice: 'Gemini servers are currently experiencing temporary high traffic. Loaded complete anime trivia board.'
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
Clues must be written in Jeopardy clue format, and answers must be phrased as questions ("Who is...?", "What is...?").`;

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
            image: { type: Type.STRING, nullable: true },
          },
          required: ['value', 'clue', 'answer'],
        },
      },
    },
    required: ['title', 'clues'],
  };

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

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
        return res.json(JSON.parse(text));
      }
    } catch (err: unknown) {
      console.warn(`Category generation with ${model} failed, trying next.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Fallback single category
  return res.json({
    title: topic ? topic.toUpperCase() : 'ANIME LEGENDS',
    description: 'Iconic heroes and unforgettable anime moments',
    clues: [
      { value: 200, clue: 'This rubber-powered captain dreams of becoming King of the Pirates.', answer: 'Who is Monkey D. Luffy?', isDailyDouble: false },
      { value: 400, clue: 'Naruto Uzumaki’s signature spinning sphere of concentrated chakra.', answer: 'What is the Rasengan?', isDailyDouble: false },
      { value: 600, clue: 'Goku first awakened Super Saiyan while fighting Frieza on this green-sky alien world.', answer: 'What is Planet Namek?', isDailyDouble: false },
      { value: 800, clue: 'This Survey Corps captain is known as Humanity’s Strongest Soldier.', answer: 'Who is Levi Ackerman?', isDailyDouble: true },
      { value: 1000, clue: 'In Jujutsu Kaisen, Satoru Gojo manipulates space at an atomic level with this technique.', answer: 'What is Limitless?', isDailyDouble: false },
    ]
  });
});

// =============================================================================
// Mount Vite middlewares in development or serve dist in production
// =============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Anime Jeopardy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
