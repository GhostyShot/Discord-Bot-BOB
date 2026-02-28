# 🚀 Backend Setup Guide

The backend proxy server enables **live‑status detection** and **real‑time stats** for YouTube, Twitch, and TikTok.

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Create `.env` file in `server/` directory

```
PORT=3000
TWITCH_CLIENT_ID=your_twitch_client_id_here
```

**Optional:** Add these for better security:
- `YOUTUBE_API_KEY=your_key_here` (if you want to store key server‑side)
- `TWITCH_CLIENT_ID=your_client_id_here`

### 3. Start the server

```bash
npm start
```

Server runs on `http://localhost:3000`

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `PORT` | Server port | No (default: 3000) |
| `TWITCH_CLIENT_ID` | Twitch API Client ID | Optional (some endpoints need it) |
| `YOUTUBE_API_KEY` | YouTube API key | Optional (frontend can supply) |

---

## API Endpoints

### YouTube

**GET `/api/yt/status`**

Returns live status, title, viewer count.

Query params:
- `channel` (required) – handle or channel ID (UC...)
- `key` (optional) – YouTube API key

Example:
```bash
curl "http://localhost:3000/api/yt/status?channel=paul_fmp&key=YOUR_API_KEY"
```

Response:
```json
{
  "isLive": true,
  "title": "Gaming Stream",
  "videoId": "xxx",
  "viewerCount": "1200"
}
```

---

**GET `/api/yt/stats`**

Returns channel statistics (subs, views, etc).

Query params:
- `channel` (required)
- `key` (required) – YouTube API key

Example:
```json
{
  "viewCount": "1000000",
  "commentCount": "5000",
  "subscriberCount": "50000",
  "hiddenSubscriberCount": false,
  "videoCount": "150"
}
```

---

### Twitch

**GET `/api/twitch/status`**

Returns live status, title, viewer count.

Query params:
- `username` (required) – Twitch username
- `token` (optional) – OAuth token
- `client_id` (optional) – Twitch Client ID

Example:
```bash
curl "http://localhost:3000/api/twitch/status?username=paul_fmp&token=YOUR_TOKEN"
```

Response:
```json
{
  "isLive": true,
  "title": "Chill gaming",
  "viewer_count": "500",
  "game_name": "Just Chatting"
}
```

---

### TikTok

**GET `/api/tiktok/status`**

⚠️ Placeholder only – cannot detect live status without scraping or backend service. Always returns `{ isLive: false }`.

Future: Could integrate third‑party API or implement scraping.

---

## Caching Strategy

All endpoints cache responses in memory:
- **YouTube status:** 30 seconds
- **YouTube stats:** 60 seconds
- **Twitch status:** 30 seconds

Prevents rate‑limiting and reduces API calls.

---

## How Frontend Uses It

In [`assets/js/api.js`](../assets/js/api.js):

```javascript
// In APIManager class
_apiBase() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return ''; // fallback when backend unavailable
}

// Frontend calls:
async fetchYouTubeStatus() {
  const url = `${this._apiBase()}/api/yt/status?channel=${this.config.yt_channel}&key=${this.config.yt_api_key}`;
  const resp = await fetch(url);
  return await resp.json();
}
```

---

## Deployment

For production deployment on Vercel, Render, or Heroku:

1. Copy `server/` to your hosting platform
2. Set environment variables in the platform's dashboard
3. Update frontend `_apiBase()` to point to your deployed backend URL
4. Update frontend CORS if needed (currently unrestricted for localhost)

Example for Vercel Functions:
- Rename `server.js` → `api/index.js`
- Export handler instead of `app.listen()`

---

## Troubleshooting

### Backend not responding
- Check if server is running: `http://localhost:3000`
- Check console for errors
- Verify API keys are correct

### "Cannot POST /api/..."
- Endpoints are GET only

### Live status always shows as offline
- YouTube/Twitch requires API key or token
- Check browser DevTools → Network tab to see request/response

### Rate limit errors from YouTube/Twitch
- Implement stricter caching (`ttl` values in `server.js`)
- Add official API quotas to .env

---

## Future Enhancements

- [ ] Add Twitch EventSub WebSocket for true push updates
- [ ] Implement YouTube PubSub for instant live notifications
- [ ] TikTok scraper or third‑party API integration
- [ ] Database to log stats history
- [ ] Dashboard showing API usage & quotas
