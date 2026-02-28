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

  // YouTube - Get channel link and basic info (no API key needed)
  async fetchYouTube() {
    if (!this.config.yt_channel) return null;

    try {
      const channel = this.config.yt_channel;
      // allow either a handle (e.g. "myChannel") or a raw channel id (starts with UC)
      let channelUrl;
      if (/^UC/.test(channel)) {
        channelUrl = `https://www.youtube.com/channel/${channel}`;
      } else {
        // strip leading @ if present
        const handle = channel.replace(/^@/, '');
        channelUrl = `https://www.youtube.com/@${handle}`;
      }

      return {
        channelName: channel,
        channelUrl,
        isLive: false, // detecting live requires API key
        message: 'YouTube channel loaded (API key optional for live detection)'
      };
    } catch (error) {
      console.error('YouTube error:', error);
      return null;
    }
  }

  // Twitch - Get channel link and info (no API key needed for basic info)
  async fetchTwitch() {
    if (!this.config.twitch_username) return null;

    try {
      // Without API key, we just return the channel info for linking
      return {
        username: this.config.twitch_username,
        channelUrl: `https://www.twitch.tv/${this.config.twitch_username}`,
        isLive: false, // Would need API key to detect
        message: 'Twitch channel loaded (API key optional for live detection)'
      };
    } catch (error) {
      console.error('Twitch error:', error);
      return null;
    }
  }

  // TikTok - Simulated (TikTok doesn't have public API)
  // This would need backend proxy or alternative service
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
  const data = await apiManager.fetchYouTube();
  const ytLink = document.getElementById('yt-link');
  const youtubeNode = document.getElementById('youtube-node');
  const ytStats = document.getElementById('yt-stats');
  const ytStatus = document.getElementById('yt-status');
  const ytPreview = document.getElementById('yt-live-preview');

  if (!data || !data.channelUrl) {
    ytStats.textContent = 'Not configured';
    ytPreview.textContent = 'Enter your YouTube handle/ID in config';
    ytLink.href = '#';
    youtubeNode.href = '#';
    ytLink.classList.add('disabled');
    youtubeNode.classList.add('disabled');
    return;
  }

  ytLink.classList.remove('disabled');
  youtubeNode.classList.remove('disabled');
  ytLink.href = data.channelUrl;
  youtubeNode.href = data.channelUrl;
  // show handle/ID consistently
  let displayName = data.channelName || '';
  if (displayName && !displayName.startsWith('@') && !/^UC/.test(displayName)) {
    displayName = '@' + displayName;
  }
  ytStats.textContent = displayName;
  ytStatus.classList.remove('live');
  ytPreview.textContent = '📺 Ready to stream - click to visit channel';
}

async function loadTwitch() {
  const data = await apiManager.fetchTwitch();
  const twitchLink = document.getElementById('twitch-link');
  const twitchNode = document.getElementById('twitch-node');
  const twitchStats = document.getElementById('twitch-stats');
  const twitchStatus = document.getElementById('twitch-status');
  const twitchPreview = document.getElementById('twitch-live-preview');

  if (!data || !data.channelUrl) {
    twitchStats.textContent = 'Not configured';
    twitchPreview.textContent = 'Enter your Twitch username in config';
    twitchLink.href = '#';
    twitchNode.href = '#';
    twitchLink.classList.add('disabled');
    twitchNode.classList.add('disabled');
    return;
  }

  twitchLink.classList.remove('disabled');
  twitchNode.classList.remove('disabled');
  twitchLink.href = data.channelUrl;
  twitchNode.href = data.channelUrl;
  twitchStats.textContent = '@' + data.username;
  twitchStatus.classList.remove('live');
  twitchPreview.textContent = '🎮 Ready to stream - click to visit channel';
}

function loadTikTok() {
  const tiktokLink = document.getElementById('tiktok-link');
  const tiktokNode = document.getElementById('tiktok-node');
  const tiktokStats = document.getElementById('tiktok-stats');
  const tiktokStatus = document.getElementById('tiktok-status');

  if (!apiManager.config.tiktok_username) {
    tiktokStats.textContent = 'Not configured';
    tiktokStatus.classList.remove('live');
    tiktokLink.href = '#';
    tiktokNode.href = '#';
    tiktokLink.classList.add('disabled');
    tiktokNode.classList.add('disabled');
    return;
  }

  const tiktokUrl = `https://www.tiktok.com/@${apiManager.config.tiktok_username}`;
  tiktokLink.classList.remove('disabled');
  tiktokNode.classList.remove('disabled');
  tiktokLink.href = tiktokUrl;
  tiktokNode.href = tiktokUrl;
  tiktokStats.textContent = '@' + apiManager.config.tiktok_username;
  tiktokStatus.classList.remove('live');
}
