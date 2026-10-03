# Anime Jeopardy for Raspberry Pi (Docker & Portainer)

A lightweight, family-friendly Anime Jeopardy game built specifically to run offline on a **Raspberry Pi** (ARM64 / ARMv7) or home server via **Portainer** and **Docker**.

Includes classic Jeopardy gameplay with 6 categories, 5 clues ($200–$1000), Daily Double, Final Jeopardy, team score tracking (2–6 teams), image clues, sound synthesizer effects, and large TV-friendly buttons for couch play.

---

## ⚡ Quick Start: Deploy via Portainer

Portainer makes deployment on a Raspberry Pi a breeze.

### Method 1: Portainer Web Editor (Easiest)

1. Open Portainer in your web browser: `http://<raspberry-pi-ip>:9000` (or `9443`).
2. Go to **Stacks** in the left menu.
3. Click **+ Add stack**.
4. Name the stack: `anime-jeopardy`.
5. Select the **Web editor** tab and paste the contents of `docker-compose.yml`:

```yaml
services:
  anime-jeopardy:
    image: nginx:alpine
    container_name: anime_jeopardy
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      # Map your local directory containing the game files to Nginx
      - /home/pi/anime-jeopardy/standalone:/usr/share/nginx/html:ro
      # Map your custom anime images folder
      - /home/pi/anime-jeopardy/images:/usr/share/nginx/html/images:ro
```

6. Click **Deploy the stack**.
7. Open `http://<raspberry-pi-ip>:8080` on any phone, tablet, computer, or Smart TV on your home Wi-Fi!

---

### Method 2: Command Line (SSH onto Raspberry Pi)

```bash
# 1. Clone or copy this repository to your Raspberry Pi
git clone <your-repo-url> anime-jeopardy
cd anime-jeopardy

# 2. Build and launch the container
docker compose up -d

# 3. Check container status
docker ps
```

The container runs using official `nginx:alpine` and consumes only **~15MB of RAM**, making it practically invisible to Raspberry Pi CPU and memory.

---

## 🖼️ How to Add Custom Local Images

The game supports showing pictures next to clues (character reveals, mystery silhouettes, scene recognition, weapons).

1. Put your image files (`.jpg`, `.png`, `.webp`, `.svg`) inside the `images/` folder on your Raspberry Pi:
   ```bash
   /home/pi/anime-jeopardy/images/luffy.jpg
   /home/pi/anime-jeopardy/images/goku.png
   /home/pi/anime-jeopardy/images/totoro.webp
   ```
2. Open `standalone/game-data.js` and set the clue's `image` property:
   ```javascript
   {
     value: 200,
     clue: "This stretchy captain ate the Gum-Gum Fruit...",
     answer: "Who is Monkey D. Luffy?",
     image: "/images/luffy.jpg" // Local file path
   }
   ```
3. Refresh `http://<raspberry-pi-ip>:8080` in your browser. Nginx immediately serves your image!

*Note: If an image file isn't found or hasn't been added yet, the game automatically shows a clean anime fallback card without breaking the layout.*

---

## ✏️ How to Edit or Add Your Own Questions

### Option A: Use the Built-in AI Trivia Generator (Fastest!)
Click the **"✨ AI Question Generator"** button in the top bar. You can choose a preset theme (e.g. *Shonen All-Stars*, *Studio Ghibli*, *Modern Mega-Hits*, *90s Classics*, or type any custom anime title) and Gemini will write 6 full categories with 30 clues and Final Jeopardy in authentic Jeopardy style.
Click **"Download for Raspberry Pi"** to save `game-data.js`, and replace `standalone/game-data.js` on your Pi!

### Option B: Manually Edit `standalone/game-data.js`
All trivia categories, dollar values, clues, and answers are stored in plain JavaScript in `standalone/game-data.js`.

Open `standalone/game-data.js` in any text editor:

```javascript
window.ANIME_JEOPARDY_DATA = {
  title: "Anime Family Game Night Jeopardy",
  categories: [
    {
      id: "my-custom-category",
      title: "SHONEN HEROES",
      clues: [
        {
          value: 200,
          clue: "This Ninja from the Hidden Leaf dreams of becoming Hokage.",
          answer: "Who is Naruto Uzumaki?",
          image: "/images/naruto.jpg"
        },
        // ... up to $1000
      ]
    },
    // ... 6 categories total
  ],
  finalJeopardy: {
    category: "CREATORS",
    clue: "Creator of Dragon Ball who revolutionized the shonen genre.",
    answer: "Who is Akira Toriyama?"
  }
};
```

---

## 📺 Playing on TV / Family Game Night

- **Full Screen Mode**: Press the **Fullscreen** button or tap `F` on a connected keyboard to hide the browser URL bar on your TV or projector.
- **Host Hotkeys**:
  - `Spacebar`: Reveal Answer / Advance
  - `Escape`: Close clue modal
  - Click `+` or `-` under each team to quickly adjust scores if a team misspoke or disputed an answer.
- **Buzzer / Audio**: Synthesized Web Audio API sound effects run 100% in browser (no external mp3 files needed).
- **Daily Double**: Allows the chosen team to wager between $5 and their current score (or up to $1000 if their score is low).

---

## 📂 Project Structure

```text
anime-jeopardy/
├── docker-compose.yml       # Ready-to-use Docker compose stack for Portainer
├── Dockerfile               # Multi-arch Nginx Alpine image builder
├── nginx.conf               # Nginx server configuration with caching & gzip
├── README.md                # This setup & customization manual
├── images/                  # Mount folder for custom pictures (.jpg, .png)
│   └── README.txt
└── standalone/              # Zero-dependency vanilla web app
    ├── index.html           # Main HTML structure
    ├── style.css            # TV-optimized Jeopardy stylesheet
    ├── game-data.js         # 30 Anime clues + Final Jeopardy + local image paths
    └── game.js              # State machine, scoring, audio synth, TV controls
```

---

## 🛠️ Hardware Requirements

- **Device**: Any Raspberry Pi 2, 3, 4, 5, or Zero 2 W running Raspberry Pi OS (32-bit or 64-bit)
- **RAM**: ~15 MB
- **Storage**: ~30 MB (including Nginx Alpine base image)
- **Network**: Local LAN / Wi-Fi only (no internet connection required after Docker pull)
