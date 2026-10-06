# Family Jeopardy - Family Game Night

A full-featured, family-friendly Jeopardy web game with interactive host controls, an AI-powered trivia generator, authentic Jeopardy sound effects, team buzzer scoring, and customizable clue decks.

---

## 🌟 Key Features

- **Classic Jeopardy Board**: 6 customizable categories, 5 clue tiers ($200–$1,000), Daily Double wagers, and a Final Jeopardy round.
- **Host Answer Sheet (Admin View)**: A dedicated host dashboard showing all clues, correct answers, and Daily Double locations in real-time, so the host always knows the answer without having to reveal it on the main board!
- **AI Trivia Generator**: Built-in Gemini AI generator to create full custom Jeopardy boards on any anime theme (*Shonen Legends*, *Studio Ghibli*, *Modern Hits*, *Cyberpunk & Mecha*, *Isekai*, or custom topics).
- **Audio Synthesizer**: 100% browser-synthesized Jeopardy Think Music, Daily Double fanfare, right/wrong chimes, and triple buzzers without external audio dependencies.
- **Team Scoreboard**: Support for 2 to 6 teams with custom names, point tracking, and quick +/- score adjustments.
- **Clue Editor**: In-app clue customizer allowing quick edits to any clue, answer, dollar value, or image.
- **TV & Couch Play**: TV Fullscreen mode (`F` key) and keyboard hotkeys for seamless living room game nights.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Docker & Portainer Deployment (Raspberry Pi / Home Server)
To run the full-stack app with the AI Trivia Generator and real-time multi-screen sync:
```bash
# 1. Create project directory and enter it
mkdir -p ~/family-jeopardy && cd ~/family-jeopardy

# 2. Launch the container
docker compose up -d --build
```
Or in Portainer (Stacks -> Add Stack):
```yaml
version: '3.8'

services:
  family-jeopardy:
    build: .
    container_name: family-jeopardy
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=AQ.Ab8YourAuthenticationKeyHere
```
*Note: Supports both Google's newer, more secure `AQ.Ab8...` Authentication Keys and legacy `AIzaSy...` keys from [Google AI Studio](https://aistudio.google.com/app/apikey).*

### 🐍 Python (FastAPI + official google-genai SDK) Option
To run the full-stack container using the **Python backend** powered by Google's official `google-genai` Python library:
```bash
# Launch with Python backend Dockerfile
docker compose -f docker-compose.python.yml up -d --build
```
Or run directly with Python:
```bash
cd python_backend
pip install -r requirements.txt
export GEMINI_API_KEY=AQ.Ab8YourKeyHere
python server.py
```

---

## 🛡️ Host Answer Sheet (Private Host Admin)

During family game night, the host can view all answers without revealing them to the players:

1. Click the green **"Host Answer Sheet"** button in the top navigation bar (or press `H` on your keyboard).
2. The modal displays:
   - All categories and dollar values.
   - The hidden Daily Double locations (highlighted with a 🌟 badge).
   - The full clue prompt and the exact correct answer.
   - Quick search and category filter to easily find any clue as teams call them out.
3. The host can keep this open on a phone, tablet, or secondary window while projecting the main board to the TV.

---

## 🤖 AI Question Generator

Generate custom anime trivia decks in seconds:

1. Click **"✨ AI Trivia Generator"** in the top bar.
2. Select a quick preset (*Shonen All-Stars*, *Studio Ghibli Magic*, *Modern Anime Mega-Hits*, *90s & 2000s Nostalgia*, *Mecha & Sci-Fi*) or type any custom topic.
3. Choose your desired difficulty (Family / Mixed, Casual Anime Fans, or Hardcore Otaku).
4. Click **"Generate Complete Jeopardy Board"**.
5. Review the generated categories and clues, then click **"Apply to Game Board"** to start playing immediately.

---

## ⌨️ Game Controls & Hotkeys

- **Spacebar**: Reveal answer / advance
- **H**: Open / close Host Answer Sheet
- **F**: Toggle Fullscreen TV Mode
- **Escape**: Close any open modal or clue
- **+/- Buttons**: Adjust team scores manually

---

## 🖼️ Adding Custom Images

To include custom pictures for clues:
1. Place your image files in the `images/` directory or use any web image URL.
2. In the **Edit Clues** panel, paste the relative path (e.g. `/images/luffy.jpg`) or external URL into the Clue Image field.
3. If an image is not supplied, the game renders a clean, themed anime card fallback so the layout always looks great.
