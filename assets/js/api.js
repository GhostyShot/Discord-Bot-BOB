// API Integration Module
class APIManager {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    const defaults = {
      github: 'GhostyShot',
      github_token: '',
      yt_channel: 'paul_fmp', // handle or id
      yt_api_key: '',
      twitch_username: 'paul_fmp',
      twitch_api_key: '',
      twitch_client_id: '',
      tiktok_username: 'paul_fmp',
      discord_invite: 'https://discord.gg/GCdtRkHb6X'
    };

    const stored = localStorage.getItem('portfolioConfig');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // merge with defaults so missing keys won't break things
        this.config = Object.assign({}, defaults, parsed);
      } catch (e) {
        console.warn('Invalid config in localStorage, resetting to defaults');
        this.config = defaults;
      }
    } else {
      // no stored config, use defaults
      this.config = defaults;
    }

    // if for some reason github username is falsy, we keep the default value
    if (!this.config.github) {
      this.config.github = defaults.github;
    }
  }

  saveConfig(config) {
    this.config = config;
    localStorage.setItem('portfolioConfig', JSON.stringify(config));
  }

  // GitHub API - Get user profile and repos (no auth needed for public data)
  async fetchGitHub() {
    if (!this.config.github) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);  // 8s timeout

      const headers = { 'Accept': 'application/vnd.github.v3+json' };
      if (this.config.github_token) {
        headers['Authorization'] = `token ${this.config.github_token}`;
      }

      const userRes = await fetch(`https://api.github.com/users/${this.config.github}`, { signal: controller.signal, headers });
      if (!userRes.ok) {
        // detect rate limit / auth errors and return structured error
        const err = { status: userRes.status, message: 'GitHub user fetch failed' };
        try {
          const txt = await userRes.text();
          err.body = txt;
        } catch (e) {}
        clearTimeout(timeoutId);
        return { error: err };
      }
      const userData = await userRes.json();

      const reposRes = await fetch(
        `https://api.github.com/users/${this.config.github}/repos?sort=updated&per_page=6`,
        { signal: controller.signal, headers }
      );
      if (!reposRes.ok) {
        const err = { status: reposRes.status, message: 'GitHub repos fetch failed' };
        try { err.body = await reposRes.text(); } catch (e) {}
        clearTimeout(timeoutId);
        return { error: err };
      }
      const repos = await reposRes.json();

      clearTimeout(timeoutId);
      return { user: userData, repos: repos };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('GitHub API request timed out');
      } else {
        console.error('GitHub API error:', error);
      }
      return null;
    }
  }

  // --- utility for contacting backend proxy ---
  _apiBase() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return '';
  }

  // YouTube helpers (will fall back to plain link if no key provided)
  async fetchYouTubeStatus() {
    if (!this.config.yt_channel) return null;
    const params = new URLSearchParams({ channel: this.config.yt_channel });
    if (this.config.yt_api_key) params.set('key', this.config.yt_api_key);
    const url = `${this._apiBase()}/api/yt/status?${params.toString()}`;
    try {
      const resp = await fetch(url);
      return await resp.json();
    } catch (e) {
      console.error('fetchYouTubeStatus error', e);
      return null;
    }
  }

  async fetchYouTubeStats() {
    if (!this.config.yt_channel || !this.config.yt_api_key) return null;
    const params = new URLSearchParams({ channel: this.config.yt_channel, key: this.config.yt_api_key });
    const url = `${this._apiBase()}/api/yt/stats?${params.toString()}`;
    try {
      const resp = await fetch(url);
      return await resp.json();
    } catch (e) {
      console.error('fetchYouTubeStats error', e);
      return null;
    }
  }

  // fallback for links without API calls
  async fetchYouTube() {
    if (!this.config.yt_channel) return null;
    const channel = this.config.yt_channel;
    let channelUrl;
    if (/^UC/.test(channel)) {
      channelUrl = `https://www.youtube.com/channel/${channel}`;
    } else {
      const handle = channel.replace(/^@/, '');
      channelUrl = `https://www.youtube.com/@${handle}`;
    }
    return { channelName: channel, channelUrl, isLive: false };
  }

  // Twitch helpers
  async fetchTwitchStatus() {
    if (!this.config.twitch_username) return null;
    const params = new URLSearchParams({ username: this.config.twitch_username });
    if (this.config.twitch_api_key) params.set('token', this.config.twitch_api_key);
    if (this.config.twitch_client_id) params.set('client_id', this.config.twitch_client_id);
    const url = `${this._apiBase()}/api/twitch/status?${params.toString()}`;
    try {
      const resp = await fetch(url);
      return await resp.json();
    } catch (e) {
      console.error('fetchTwitchStatus error', e);
      return null;
    }
  }

  async fetchTwitch() {
    if (!this.config.twitch_username) return null;
    return {
      username: this.config.twitch_username,
      channelUrl: `https://www.twitch.tv/${this.config.twitch_username}`,
      isLive: false
    };
  }

  // TikTok helper (status is proxy-stub)
  async fetchTikTokStatus() {
    if (!this.config.tiktok_username) return null;
    const params = new URLSearchParams({ username: this.config.tiktok_username });
    const url = `${this._apiBase()}/api/tiktok/status?${params.toString()}`;
    try {
      const resp = await fetch(url);
      return await resp.json();
    } catch (e) {
      console.error('fetchTikTokStatus error', e);
      return null;
    }
  }

  getWebTikTokLink() {
    if (!this.config.tiktok_username) return null;
    const username = this.config.tiktok_username.startsWith('@') 
      ? this.config.tiktok_username 
      : '@' + this.config.tiktok_username;
    return `https://tiktok.com/${username}`;
  }
}

// Initialize API Manager
const apiManager = new APIManager();

// Persist defaults to localStorage if no user config exists
if (!localStorage.getItem('portfolioConfig')) {
  try {
    localStorage.setItem('portfolioConfig', JSON.stringify(apiManager.config));
  } catch (e) {
    console.warn('Unable to write default config to localStorage:', e);
  }
}

// On page load we simply refresh data.  Configuration must now be managed
// manually (localStorage or editing api.js).
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setInterval(loadAllData, 120000);
});

async function loadAllData() {
  loadGitHub();
  loadYouTube();
  loadTwitch();
  loadTikTok();
  loadDiscord();
}

function loadDiscord() {
  const discordLink = document.getElementById('discord-node');
  if (!discordLink) return;
  const invite = apiManager.config.discord_invite;
  if (invite) {
    discordLink.href = invite;
    discordLink.classList.remove('disabled');
  } else {
    discordLink.href = '#';
    discordLink.classList.add('disabled');
  }
}

async function loadGitHub() {
  const githubLink = document.getElementById('github-link');
  const githubStats = document.getElementById('github-stats');
  const reposContainer = document.getElementById('github-repos');

  // Always set the profile link from config (so the node is clickable even if API fails)
  if (githubLink) {
    githubLink.href = `https://github.com/${apiManager.config.github}`;
    githubLink.classList.remove('disabled');
  }

  // Always show username in stats, regardless of API success
  if (githubStats) {
    githubStats.textContent = apiManager.config.github;
  }

  // Try fetching repo data; if it fails, show a friendly message but keep link live
  const data = await apiManager.fetchGitHub();

  if (!data || data.error) {
    if (reposContainer) {
      // If fetch returned an error object with status 403, suggest adding a token
      let message = 'Unable to fetch repositories right now. Click the node to view the profile.';
      if (data && data.error && data.error.status === 403) {
        message = 'GitHub rate limit reached. You can provide a Personal Access Token to increase rate limits.';
      }
      reposContainer.innerHTML = `
        <div class="info" style="max-width:520px">
          ${message}
          <div style="margin-top:12px">
            <button id="add-github-token" class="cyber-button">Add GitHub token</button>
          </div>
        </div>`;

      // wire up token button
      setTimeout(() => {
        const btn = document.getElementById('add-github-token');
        if (btn) {
          btn.addEventListener('click', () => {
            const token = prompt('Paste a GitHub Personal Access Token (no scopes required for public data):');
            if (token) {
              apiManager.config.github_token = token.trim();
              apiManager.saveConfig(apiManager.config);
              // retry loading repos
              loadGitHub();
            }
          });
        }
      }, 50);
    }
    return;
  }

  githubStats.textContent = `${data.user.public_repos} repos`;

  reposContainer.innerHTML = '';

  if (!data.repos || data.repos.length === 0) {
    reposContainer.innerHTML = '<p class="info">No repositories found.</p>';
    return;
  }

  data.repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      <h3><i class="fas fa-code-branch"></i> ${repo.name}</h3>
      <p>${repo.description || 'No description provided'}</p>
      <div class="repo-meta">
        <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
        <span><i class="fas fa-code-fork"></i> ${repo.forks_count}</span>
        <span>${repo.language || 'N/A'}</span>
      </div>
    `;
    card.addEventListener('click', () => window.open(repo.html_url, '_blank'));
    reposContainer.appendChild(card);
  });
}

async function loadYouTube() {
  const linkElem = document.getElementById('yt-link');
  const nodeElem = document.getElementById('youtube-node');
  const statsElem = document.getElementById('yt-stats');
  const statusElem = document.getElementById('yt-status');
  const previewElem = document.getElementById('yt-live-preview');

  const base = await apiManager.fetchYouTube();
  let status = null;
  let stats = null;
  if (apiManager.config.yt_api_key) {
    status = await apiManager.fetchYouTubeStatus();
    stats = await apiManager.fetchYouTubeStats();
  }

  if (!base || !base.channelUrl) {
    statsElem.textContent = 'Not configured';
    previewElem.textContent = 'Enter your YouTube handle/ID in config';
    if (linkElem) linkElem.href = '#';
    if (nodeElem) nodeElem.href = '#';
    if (linkElem) linkElem.classList.add('disabled');
    if (nodeElem) nodeElem.classList.add('disabled');
    return;
  }

  if (linkElem) {
    linkElem.classList.remove('disabled');
    linkElem.href = base.channelUrl;
  }
  if (nodeElem) {
    nodeElem.classList.remove('disabled');
    nodeElem.href = base.channelUrl;
  }
  // choose display text: if we have stats, show subs, else show handle
  if (stats && stats.subscriberCount) {
    const subs = parseInt(stats.subscriberCount, 10);
    statsElem.textContent = `${(subs/1000).toFixed(1)}K subs`;
  } else {
    let displayName = base.channelName || '';
    if (displayName && !displayName.startsWith('@') && !/^UC/.test(displayName)) {
      displayName = '@' + displayName;
    }
    statsElem.textContent = displayName;
  }

  // live status
  if (status && status.isLive) {
    statusElem.classList.add('live');
    previewElem.innerHTML = `<strong style="color:#00ff00">🔴 LIVE NOW!</strong><br>${status.title || ''}`;
    if (status.viewerCount) {
      previewElem.innerHTML += `<br><small>${status.viewerCount} watching</small>`;
    }
  } else {
    statusElem.classList.remove('live');
    previewElem.textContent = '📺 Ready to stream - click to visit channel';
  }
}

async function loadTwitch() {
  const twitchLink = document.getElementById('twitch-link');
  const twitchNode = document.getElementById('twitch-node');
  const twitchStats = document.getElementById('twitch-stats');
  const twitchStatus = document.getElementById('twitch-status');
  const twitchPreview = document.getElementById('twitch-live-preview');

  const base = await apiManager.fetchTwitch();
  let status = null;
  if (apiManager.config.twitch_username && apiManager.config.twitch_api_key) {
    status = await apiManager.fetchTwitchStatus();
  }

  if (!base || !base.channelUrl) {
    twitchStats.textContent = 'Not configured';
    twitchPreview.textContent = 'Enter your Twitch username in config';
    if (twitchLink) twitchLink.href = '#';
    if (twitchNode) twitchNode.href = '#';
    if (twitchLink) twitchLink.classList.add('disabled');
    if (twitchNode) twitchNode.classList.add('disabled');
    return;
  }
  if (twitchLink) {
    twitchLink.classList.remove('disabled');
    twitchLink.href = base.channelUrl;
  }
  if (twitchNode) {
    twitchNode.classList.remove('disabled');
    twitchNode.href = base.channelUrl;
  }
  twitchStats.textContent = '@' + base.username;

  if (status && status.isLive) {
    twitchStatus.classList.add('live');
    twitchPreview.innerHTML = `<strong style="color:#00ff00">🔴 LIVE NOW!</strong><br>${status.title || ''}`;
    if (status.viewer_count) {
      twitchPreview.innerHTML += `<br><small>${status.viewer_count} viewers</small>`;
    }
  } else {
    twitchStatus.classList.remove('live');
    twitchPreview.textContent = '🎮 Ready to stream - click to visit channel';
  }
}

async function loadTikTok() {
  const tiktokLink = document.getElementById('tiktok-link');
  const tiktokNode = document.getElementById('tiktok-node');
  const tiktokStats = document.getElementById('tiktok-stats');
  const tiktokStatus = document.getElementById('tiktok-status');

  if (!apiManager.config.tiktok_username) {
    tiktokStats.textContent = 'Not configured';
    tiktokStatus.classList.remove('live');
    if (tiktokLink) tiktokLink.href = '#';
    if (tiktokNode) tiktokNode.href = '#';
    if (tiktokLink) tiktokLink.classList.add('disabled');
    if (tiktokNode) tiktokNode.classList.add('disabled');
    return;
  }

  const tiktokUrl = `https://www.tiktok.com/@${apiManager.config.tiktok_username}`;
  tiktokLink.classList.remove('disabled');
  tiktokNode.classList.remove('disabled');
  tiktokLink.href = tiktokUrl;
  tiktokNode.href = tiktokUrl;
  tiktokStats.textContent = '@' + apiManager.config.tiktok_username;

  // check live status via backend proxy
  const status = await apiManager.fetchTikTokStatus();
  if (status && status.isLive) {
    tiktokStatus.classList.add('live');
    // viewer count not provided by proxy
  } else {
    tiktokStatus.classList.remove('live');
  }
}
