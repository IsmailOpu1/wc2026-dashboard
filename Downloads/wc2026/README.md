# ⚽ FIFA World Cup 2026 Dashboard

A modern, responsive dashboard for tracking the FIFA World Cup 2026. Features live standings, match schedules, and knockout stage visualization.

**Created by Ismail Opu**

---

## ✨ Features

- **📊 Group Stage View**
  - All 12 groups with live standings
  - Real-time points, goals, and qualification status
  - Group filter pills for quick navigation
  - Match schedules within each group

- **⚽ Matches View**
  - Live, Upcoming, and Finished match filters
  - Real-time score updates
  - Auto-refresh every 30s for live matches
  - Knockout stage matches with round-by-round breakdown

- **🏆 Knockout Stage**
  - Round of 32, Round of 16, Quarter-finals, Semi-finals, Final
  - Team qualification tracking
  - Venue information for the final

- **🎨 Modern UI**
  - Dark theme with green accents
  - Responsive design for all devices
  - Smooth animations and transitions
  - Country flags for all teams

- **⚡ Performance**
  - API response caching (5-minute cache)
  - Prevents rate limit issues
  - Fast load times

---

## 🛠 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CSS** - Custom styling with CSS variables
- **football-data.org API** - Live match data

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Free API key from [football-data.org](https://www.football-data.org/client/register)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/IsmailOpu1/wc2026-dashboard.git
cd wc2026-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Add your API key**
Open `.env` and paste your football-data.org API key:
```
VITE_FOOTBALL_API_KEY=your_api_key_here
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

---

## 🌐 Deploy to Vercel

### Step 1: Get your API key
1. Go to [football-data.org](https://www.football-data.org/client/register)
2. Sign up (free, instant)
3. Copy your API key from the dashboard

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub
2. Click **Add New Project**
3. Import your `wc2026-dashboard` repo
4. Click **Deploy** (Vite is auto-detected)

### Step 4: Add environment variable
1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `VITE_FOOTBALL_API_KEY`
   - Value: your API key from Step 1
3. Click **Save**

### Step 5: Redeploy
1. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**
2. Done! Your app is now live.

---

## � Project Structure

```
wc2026-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── components.jsx      # Reusable UI components (Spinner, etc.)
│   ├── utils.js            # Utility functions
│   ├── groupsData.js       # Group and knockout round data
│   ├── api.js              # API functions with caching
│   ├── App.jsx             # Main app component
│   ├── Standings.jsx       # Group standings view
│   ├── Matches.jsx         # Matches view
│   ├── FlagImg.jsx         # Flag image component
│   ├── index.css           # Global styles
│   └── main.jsx            # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Configuration

### API Rate Limiting
The app implements a 5-minute cache for API responses to prevent hitting the free tier rate limit (10 requests/minute). This ensures smooth performance even with frequent page refreshes.

### Timezone
Match times are displayed in your local timezone (browser timezone), automatically converted from UTC.

---

## � Notes

- The free tier of football-data.org has a rate limit of 10 requests per minute
- Data is cached for 5 minutes to prevent rate limit errors
- The app shows live standings when data is available from the API
- Group stage data is pre-configured with official FIFA World Cup 2026 groups

---

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

## 📄 License

This project is open source and available for personal use.

---

**Created by Ismail Opu**
