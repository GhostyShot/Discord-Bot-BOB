# 🚀 Futuristic Portfolio Nexus

A mind-blowing, futuristic portfolio with live streaming integrations, real-time API connections, and cyberpunk aesthetic.

## ✨ Features

### 🎨 Futuristic Design
- **Neon Glassmorphism** — Stunning cyan/magenta neon glows
- **Particle System** — Interactive particles following your mouse
- **Animated Grid Background** — Moving cyber grid effect
- **Scan Line Animations** — TV-like scanning effects on cards
- **3D Hover Effects** — Cards lift and glow on interaction

### 🔴 Live Stream Integration  
- **YouTube** — Show live status, latest videos, subscriber count
- **Twitch** — Display if streaming, viewer count, stream title
- **TikTok** — Auto-detect live status via web scraping, direct profile link

### 📊 Real-Time Data
- **GitHub** — Auto-load your repos with stars and forks
- **YouTube** — Latest videos and live stream detection
- **Twitch** — Viewer count and live status
- **Social Stats** — Display follower counts and engagement metrics

### 🎮 Interactive Elements
- Click-to-join live streams
- 1-Click configuration of all APIs
- Persistent local storage of settings
- Auto-refresh every 2 minutes
- Smooth scroll navigation
- Ripple click effects

## 🛠️ Setup

### 1. Built‑in Channels & Admin Panel

Your personal channels are already hard‑coded into the portfolio so it works immediately:

- **GitHub:** GhostyShot  
- **YouTube:** Paul_FMP  
- **Twitch:** paul_fmp  
- **TikTok:** paul_fmp  

You don’t need to configure anything unless you want to change those values or add API keys later.

To adjust settings or supply API credentials, click the **⚙️ ADMIN** button in the footer or open `admin.html` directly. The admin panel lets you edit:

- GitHub username (and optional access token)
- YouTube channel handle/ID & API Key
- Twitch username & OAuth token
- TikTok username
- Discord invite link

> ⚠️ **Tip:** If a link opens the platform home page instead of your channel/profile, it means the value is blank or invalid. Open the admin panel to fix it or update `localStorage` manually.

### 2. Backend Setup (for live updates)

**Required:** A Node.js backend proxy is included for live detection and API proxying.

#### Quick Start
```bash
cd server/
npm install          # or yarn install
node server.js       # runs on http://localhost:3000
```

For complete setup instructions, see [server/README.md](server/README.md).

#### Add API Keys

#### YouTube API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Create an API Key (Credentials → API Key)
5. Paste your API key and **channel handle or ID** in the admin panel (or edit `api.js` directly)

#### Twitch API (Optional - for live status)
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create an Application
3. Generate an OAuth token
4. Note your **Client ID** and OAuth token
5. Add the token and client ID in the admin panel

#### GitHub API
- Uses public API (no auth needed!)
- Just add your GitHub username
- Automatically loads your latest repos

#### TikTok
- Uses **web scraping** for live detection (no API needed)
- Simply add your TikTok username in the admin panel
- Backend automatically detects when you go live
- Requires backend proxy running (see Backend Setup)


## 📁 File Structure

```
index.html              -- Main portfolio page
admin.html              -- Configuration panel for all APIs and channels
assets/
  ├── css/
  │   └── style.css    -- 700+ lines of futuristic styling
  └── js/
      ├── api.js       -- Frontend API communication
      └── script.js    -- Particles, animations, interactions
server/
  ├── server.js        -- Express.js backend proxy (live detection, API calls)
  ├── package.json     -- Node.js dependencies
  └── README.md        -- Backend setup guide
README.md               -- This file
```

## 🎯 Customization

### Update Social Links
Links are automatically populated from configuration. If you want to hard‑code or override them, simply edit the `defaults` object in `assets/js/api.js` or use the admin panel.

For example, in `api.js`:
```javascript
const defaults = {
  github: 'GhostyShot',
  yt_channel: 'paul_fmp',
  twitch_username: 'paul_fmp',
  tiktok_username: 'paul_fmp',
  // ...
};
```

Alternatively open the admin panel and change the values via the UI.
### Change Neon Colors
Edit CSS variables in `assets/css/style.css`:
```css
:root {
  --neon-cyan: #00f0ff;      /* Main neon color */
  --neon-magenta: #ff00ff;   /* Secondary neon */
  --neon-purple: #9d00ff;    /* Accent color */
}
```

### Add Custom Content
- **Hero Title** — Edit in index.html line 38
- **Repository Cards** — Auto-populated from GitHub
- **Live Stream Cards** — Auto-populated from YouTube/Twitch

## 🔗 API Documentation

### YouTube API
- Shows 5 latest videos
- Detects if you're currently live
- Displays subscriber count
- Auto-refreshes with live notifications

### Twitch API  
- Real-time live status
- Current viewer count
- Stream title display
- Join button redirects to stream

### GitHub API
- Displays 6 latest repos
- Shows stars, forks, language
- Direct links to repositories
- No authentication required

### TikTok Integration
- ✅ Live detection via web scraping
- Direct profile link
- Username validation
- Requires backend running

## 🚀 Deployment

### Build (optional)
A simple shell script is provided to copy the source files into a `dist/` directory and optionally minify assets if tools are installed.

```bash
# run from repo root
./build.sh
```

Output will appear in `dist/` and can be deployed directly to any static host.

### GitHub Pages (Free)
```bash
git push origin main
# Enable Pages in repository settings
```

### Netlify (Free)
```bash
# Drag & drop folder to Netlify
# or connect GitHub repo
```

### Any Static Host
- Vercel, Surge, Firebase Hosting
- Just push all files

## 🎬 Animation Features

- **Particle System** — Moving particles follow mouse
- **Scanlines** — TV-like effect on live cards
- **Glitch Text** — Title glitch on hover
- **Neon Glow** — Pulsing text and borders
- **Grid Animation** — Moving background grid
- **Hover Lift** — Cards float on hover
- **Smooth Transitions** — All interactions animate

## 🧠 Performance & Reliability

- **Default configuration:** channels are pre‑loaded to avoid empty state on first visit.
- **Element guards:** each loader checks for the existence of DOM nodes before touching them, so the same script runs on both `index.html` and `admin.html` without errors.
- **Timeouts & error handling:** GitHub requests abort after 8 seconds and surface friendly messages on failure
- **Disabled links:** if a profile is not configured, links are disabled to prevent redirects to home pages.
- **2‑minute auto‑refresh** keeps data up‑to‑date with minimal network usage.

## ⚙️ Configuration Storage

All settings stored **locally** in browser:
- Encryption: None (local storage)
- Privacy: No cloud upload
- Persistence: Clears when browser cache cleared
- Backup: Can export/import JSON manually

## 📱 Browser Support

- Chrome/Edge 85+
- Firefox 78+
- Safari 14+
- Mobile browsers (responsive)

## 🔐 Security Notes

- API keys stored in `localStorage`
- No backend server = no authentication
- For production: Use backend proxy
- YouTube API key is public-visible (use restrictions)
- Never commit API keys to Git

## 🎮 Keyboard Shortcuts

- Scroll — Smooth nav highlighting
- Click particles — Mouse interaction

## 📊 Real-Time Refresh

- Auto-refresh every 2 minutes
- Manual refresh on config save
- Live status updates in real-time
- Error handling with fallbacks

## 🛣️ Roadmap

- [ ] Dark/Light mode toggle
- [ ] Advanced analytics integration
- [ ] Blog section with GitHub Pages
- [ ] Contact form (needs backend)
- [ ] Video embed gallery
- [ ] NFT portfolio (optional)
- [ ] Terminal-style interface mode
- [ ] Custom theme creator

## 🤝 Contributing Ideas

- Better TikTok integration (needs backend)
- Instagram API integration
- Twitch clips showcase
- YouTube Shorts integration
- Real-time notification system
- More glitch effects
- WebGL background

## 📄 License

Free for personal and commercial use. No attribution required!

---

**Built with:**
- Pure HTML/CSS/JavaScript
- Particle effects engine
- FontAwesome icons
- Public APIs (GitHub, YouTube, Twitch)

**Questions?** Check the browser console for API debug info.

**Live Demo:** `http://localhost:8000`

🚀 **Welcome to the future of portfolios!**
