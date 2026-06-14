# ⚽ FIFA World Cup 2026 Dashboard

> A live, real-time World Cup tracker built with React + Vite. Covers all 48 teams, 12 groups, and 104 matches — from the group stage all the way to the Final.

**Tournament:** June 11 – July 19, 2026 · USA · Canada · Mexico

---

## ✨ Features

### 🎨 Visual Design
- **Animated background** — three large floating color orbs (green, amber, cyan) that drift slowly across the page using CSS keyframe animations
- **Rising particles** — 15 glowing dots that float upward continuously, giving the page a living, breathing feel
- **Stadium ring decorations** — three concentric circles centered on the page, inspired by a football pitch center circle
- **Subtle dot grid** — a faint green dot grid overlays the full background
- **Custom football cursor** — a tiny SVG soccer ball replaces the default cursor sitewide
- **Hero title glow** — "WORLD CUP" has a green drop-shadow, "2026" glows amber
- **Barlow Condensed + Inter** — display font for numbers and headers, Inter for body text
- **Fade-up animation** — smooth entrance animation on tab switches

### 📊 Standings Tab
- **All 12 groups** displayed simultaneously in a responsive grid
- **Live API standings** — points, wins, draws, losses, GD all pulled from football-data.org in real time
- **Qualification status** — green = Top 2 advance, amber = Possible 3rd, red = Eliminated
- **Group filter pills** — filter down to a single group instantly (A through L)
- **Group match dropdowns** — expand any group card to see all 6 of its fixtures with dates and venues; only one group open at a time
- **Enhanced hover glow** — group cards lift 3px and emit a wide green glow on hover

### ⚽ Matches Tab
- **All Matches** — every group stage and knockout match with scores
- **Live Now** — currently in-progress matches with live score display and pulsing red indicator
- **Upcoming** — scheduled matches with kick-off times in your local timezone
- **Finished** — completed matches with final scores and half-time scores
- **Match cards with team-color hover glow** — hovering a Brazil match glows green, Spain glows red, Argentina glows blue, etc.
- **WATCH LIVE button** — appears on each live match card
- **↻ Refresh button** — force-clears the cache and fetches fresh data

### 🔴 Always-On Live Match Detection
- A **dedicated background poller** fetches live matches every 30 seconds — completely independent of which tab you're on
- **Live Now pill badge** always shows the correct match count on every tab (not just when you're on the Live tab)
- **Persistent live alert bar** — if a match is in progress while you're on Upcoming, All Matches, or Finished, a red clickable banner appears at the top showing which teams are playing. Click it to jump straight to Live Now
- The alert shows even when the filtered list is empty (e.g. all remaining scheduled matches have kicked off)

### 🏆 Knockout Stage (in Standings)
- Round of 32, Round of 16, Quarter-finals, Semi-finals, Third Place, Final
- Each round is expandable with projected qualifiers from the group stage
- Final venue callout: MetLife Stadium, East Rutherford, NJ · Capacity 82,500

### ⚡ Performance
- **45-second API cache** — short enough to detect a match kicking off within one refresh cycle, without hammering the rate limit
- **Auto-refresh** — Live Now tab refreshes every 30s, All Matches tab every 45s
- **Stale cache fallback** — if rate-limited (429), serves the last cached response instead of crashing
- **Custom scrollbar** — slim, theme-matching scrollbar

---

## 🛠 Run Locally

```bash
# 1. Clone
git clone https://github.com/IsmailOpu1/wc2026-dashboard.git
cd wc2026-dashboard

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env
# Open .env and paste your key from https://www.football-data.org/client/register

# 4. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deploy to Vercel

### Step 1 — Get a free API key
1. Go to [football-data.org/client/register](https://www.football-data.org/client/register)
2. Sign up (free, instant)
3. Copy your API key

### Step 2 — Deploy
1. Go to [vercel.com](https://vercel.com) and log in with GitHub
2. Click **Add New Project** → import `wc2026-dashboard`
3. Click **Deploy** (Vite is auto-detected)

### Step 3 — Add environment variable
In Vercel → your project → **Settings** → **Environment Variables**:
- Name: `VITE_FOOTBALL_API_KEY`
- Value: your key from Step 1

### Step 4 — Redeploy
Go to **Deployments** → three dots → **Redeploy**. Done!

---

## 🧱 Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Vanilla CSS with CSS variables |
| Fonts | Barlow Condensed, Inter (Google Fonts) |
| Flags | [flagcdn.com](https://flagcdn.com) |
| Data | [football-data.org](https://www.football-data.org) free tier |
| Hosting | Vercel (recommended) |

---

## 📁 Project Structure

```
src/
├── App.jsx          # Root layout, hero header, animated background
├── Standings.jsx    # Group stage tables + knockout stage view
├── Matches.jsx      # Match cards, filters, live detection
├── api.js           # API fetch with cache + rate-limit handling
├── groupsData.js    # All 12 groups, teams, and fixtures
├── utils.js         # Country codes, status labels, date formatters
├── components.jsx   # Spinner, ErrorBox, LiveDot, Empty
└── index.css        # Design tokens, animations, global styles
```

---

*Created by Ismail Opu · FIFA World Cup 2026*
