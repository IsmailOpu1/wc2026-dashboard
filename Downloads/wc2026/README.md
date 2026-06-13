# ⚽ FIFA World Cup 2026 Tracker

Live standings and match scores. Built with React + Vite, data from football-data.org.

---

## 🚀 Deploy to Vercel (5 steps)

### Step 1 — Get your free API key
1. Go to https://www.football-data.org/client/register
2. Sign up (free, instant)
3. Copy your API key from the dashboard

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "wc2026 tracker"
# create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/wc2026.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com and log in with GitHub
2. Click **Add New Project**
3. Import your `wc2026` repo
4. Click **Deploy** (Vite is auto-detected)

### Step 4 — Add your API key as an env variable
1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `VITE_FOOTBALL_API_KEY`
   - Value: your key from Step 1
3. Click **Save**

### Step 5 — Redeploy
1. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**
2. Done! Share the Vercel URL in your Discord server.

---

## 🛠 Run locally

```bash
cp .env.example .env
# paste your API key into .env

npm install
npm run dev
```

---

## Features
- 📊 Live group standings (all 12 groups)
- ⚽ Matches: Live / Upcoming / Finished
- 🔴 Auto-refresh every 30s when on Live tab
- 🔍 Group filter pills
- Mobile responsive

## Stack
- React 18 + Vite
- football-data.org free tier (10 req/min, covers World Cup)
