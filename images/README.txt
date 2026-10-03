================================================================================
ANIME JEOPARDY - CUSTOM IMAGES FOLDER
================================================================================

This directory is mounted directly into the Docker container at `/usr/share/nginx/html/images/`.

HOW TO ADD YOUR OWN CLUE PICTURES:
----------------------------------
1. Place your picture files (.jpg, .png, .webp, .svg) into this `images` folder.
   Examples:
     - luffy.jpg
     - rasengan.png
     - goku.webp
     - totoro.jpg
     - pikachu.png
     - deathnote.jpg

2. In your `game-data.js` (or in the in-game editor), set the clue's `image` field to:
     image: "/images/luffy.jpg"

3. Refresh your browser window at `http://<raspberry-pi-ip>:8080`.
   Nginx will immediately serve the image directly from this folder!

DEFAULT FALLBACKS:
------------------
If an image is not found, the game will automatically display a clean stylized anime card
with thematic vector art, so the game never breaks or shows an ugly broken image icon.
