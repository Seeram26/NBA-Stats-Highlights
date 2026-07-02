# NBA Stats & Highlights

A full-stack NBA stats and highlights web app built with Node.js that lets you search any NBA team to get live player stats and game highlight videos.

🏀 **Live Demo:** https://nba-stats-highlights.onrender.com

## Features
- Search any NBA team by name (e.g. Knicks, Lakers, Celtics)
- Displays player stats including points, rebounds, assists, and games played
- Shows recent game highlight videos with thumbnails
- Dynamic background that switches when results load

## Tech Stack
- **Backend:** Node.js (built-in http/https modules, no frameworks)
- **Frontend:** HTML, CSS, JavaScript
- **APIs:** 
  - Highlightly API (via RapidAPI) — team info and highlight videos
  - NBA Stats API — player totals and season stats

## How to Run Locally

### Prerequisites
- Node.js installed

### Setup
1. Clone the repo:
```bash
   git clone https://github.com/Seeram26/NBA-Stats-Highlights.git
   cd NBA-Stats-Highlights
```

2. Create a `credentials.json` file in the root folder:
```json
   {
       "rapidapi_key": "YOUR_RAPIDAPI_KEY",
       "rapidapi_host": "nba-ncaab-api.p.rapidapi.com"
   }
```

3. Start the server:
```bash
   node index.js
```

4. Open your browser and go to:
 http://localhost:3000
## API Chain
1. User searches a team name
2. App calls **Highlightly API** to find team info and abbreviation
3. Abbreviation is mapped to NBA Stats API format if needed
4. App calls **NBA Stats API** to get player totals for the 2026 season
5. App calls **Highlightly API** again to get recent highlight videos
6. All data is combined and returned to the frontend

## Notes
- `credentials.json` is excluded from this repo for security — you must create your own
- Get a free RapidAPI key at [rapidapi.com](https://rapidapi.com)

## Author
Seeram Govindan — Queens College CUNY, CSCI 355
