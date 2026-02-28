import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// simple in-memory cache { key: { ts: number, ttl: number, value: any }}
const cache = {};
function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    delete cache[key];
    return null;
  }
  return entry.value;
}
function setCache(key, value, ttl = 60000) {
  cache[key] = { value, ts: Date.now(), ttl };
}

// helper to convert YouTube channel identifier to channelId
async function resolveYoutubeChannelId(channel, apiKey) {
  if (!channel) return null;
  if (/^UC/.test(channel)) return channel;
  // strip leading @
  const handle = channel.replace(/^@/, '');
  // try forUsername lookup
  let url = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${handle}&key=${apiKey}`;
  let res = await fetch(url);
  let data = await res.json();
  if (data.items && data.items.length) {
    return data.items[0].id;
  }
  // fallback to search
  url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${apiKey}`;
  res = await fetch(url);
  data = await res.json();
  if (data.items && data.items.length) {
    return data.items[0].snippet.channelId;
  }
  return null;
}

// Scrape TikTok profile to detect active live streams
async function scrapeTikTok(username) {
  if (!username) return null;
  const user = username.replace(/^@/, '');
  const tiktokUrl = `https://www.tiktok.com/@${user}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(tiktokUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      clearTimeout(timeoutId);
      return null;
    }
    
    const html = await response.text();
    clearTimeout(timeoutId);
    
    // Parse HTML looking for live indicators
    const $ = cheerio.load(html);
    
    // Look for LIVE badge in page (various possible selectors)
    // TikTok's live indicator usually appears with text "LIVE" or in title
    const pageText = $.text();
    const hasLiveKeyword = /LIVE|直播|STREAMING/i.test(pageText);
    
    // Try to find viewer count in meta data or page structure
    // This is fragile since TikTok changes their HTML frequently
    let viewerCount = 0;
    
    // Look for user stats (followers, likes, etc.) to confirm page loaded
    const statsMatch = html.match(/"userCount":\s*"?([\d.MKB]+)"?/i) || 
                       html.match(/"followerCount":\s*(\d+)/i);
    
    // If we found live keyword and the page seems valid, return data
    if (hasLiveKeyword && statsMatch) {
      return {
        isLive: true,
        viewerCount: viewerCount,
        username: user
      };
    }
    
    // Check for more specific live indicators in JavaScript data
    const liveMatch = html.match(/"liveRoomId"|"liveStatus".*?"ongoing"|"isLiveStreaming":\s*true/i);
    if (liveMatch) {
      return {
        isLive: true,
        viewerCount: 0,
        username: user
      };
    }
    
    return {
      isLive: false,
      username: user
    };
  } catch (e) {
    console.error('TikTok scrape error:', e.message);
    return null;
  }
}


app.get('/api/yt/status', async (req, res) => {
  const { channel, key } = req.query;
  if (!channel) return res.json({ isLive: false });
  const cacheKey = `yt_status_${channel}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  if (!key) {
    const out = { isLive: false };
    setCache(cacheKey, out, 60000);
    return res.json(out);
  }
  try {
    const channelId = await resolveYoutubeChannelId(channel, key);
    if (!channelId) return res.json({ isLive: false });
    const statusUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${key}`;
    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();
    const isLive = statusData.items && statusData.items.length > 0;
    let info = { isLive };
    if (isLive) {
      const vid = statusData.items[0].id.videoId;
      const title = statusData.items[0].snippet.title;
      info.videoId = vid;
      info.title = title;
      // fetch live details for viewer count
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${vid}&key=${key}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      if (detailsData.items && detailsData.items[0]) {
        info.viewerCount = detailsData.items[0].liveStreamingDetails.concurrentViewers || 0;
      }
    }
    setCache(cacheKey, info, 30000);
    res.json(info);
  } catch (e) {
    console.error('yt/status error', e);
    res.json({ isLive: false });
  }
});

app.get('/api/yt/stats', async (req, res) => {
  const { channel, key } = req.query;
  if (!channel || !key) return res.json({});
  const cacheKey = `yt_stats_${channel}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  try {
    const channelId = await resolveYoutubeChannelId(channel, key);
    if (!channelId) return res.json({});
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    let out = {};
    if (statsData.items && statsData.items[0]) {
      out = statsData.items[0].statistics || {};
    }
    setCache(cacheKey, out, 60000);
    res.json(out);
  } catch (e) {
    console.error('yt/stats error', e);
    res.json({});
  }
});

app.get('/api/twitch/status', async (req, res) => {
  const { username, token, client_id } = req.query;
  if (!username) return res.json({ isLive: false });
  const cacheKey = `twitch_status_${username}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  try {
    // need either token or public API will not work
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const cid = client_id || process.env.TWITCH_CLIENT_ID;
    if (cid) headers['Client-ID'] = cid;
    // fetch user id
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, { headers });
    const userData = await userRes.json();
    const userId = userData.data && userData.data[0] && userData.data[0].id;
    if (!userId) {
      setCache(cacheKey, { isLive: false }, 30000);
      return res.json({ isLive: false });
    }
    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, { headers });
    const streamData = await streamRes.json();
    const isLive = streamData.data && streamData.data.length > 0;
    const out = { isLive };
    if (isLive) {
      const s = streamData.data[0];
      out.title = s.title;
      out.viewer_count = s.viewer_count;
      out.game_name = s.game_name;
    }
    setCache(cacheKey, out, 30000);
    res.json(out);
  } catch (e) {
    console.error('twitch/status error', e);
    res.json({ isLive: false });
  }
});

app.get('/api/tiktok/status', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.json({ isLive: false });
  }
  
  const cacheKey = `tiktok_status_${username}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const data = await scrapeTikTok(username);
    if (!data) {
      setCache(cacheKey, { isLive: false }, 30000);
      return res.json({ isLive: false });
    }
    setCache(cacheKey, data, 30000);
    res.json(data);
  } catch (e) {
    console.error('tiktok/status error', e);
    res.json({ isLive: false });
  }
});

// serve static if needed (optional)
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`API proxy server running on http://localhost:${PORT}`);
});
