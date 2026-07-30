const express = require('express');
const https = require('https');
const router = express.Router();

const TMDB_BASE_HOST = 'api.themoviedb.org';
const TMDB_BASE_PATH = '/3';

// ─── Persistent HTTPS Agent ─────────────────────────────────
// Reuses TCP/TLS connections instead of opening new ones per request.
// This is the #1 fix for ECONNRESET on Windows.
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,         // max parallel connections to TMDB
  keepAliveMsecs: 30000,  // keep idle sockets alive for 30s
});

// ─── In-Memory Cache ─────────────────────────────────────────
// Caches TMDB responses for 10 minutes so repeat page loads are instant.
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prevent unbounded memory growth — evict oldest if > 200 entries
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ─── Fetch with Retry ────────────────────────────────────────
/**
 * Fetch from TMDB API using api_key query param + Node.js native https.
 * - Uses a persistent keep-alive agent to reuse connections
 * - Retries up to 3 times with exponential backoff on network errors
 * - Results are cached for 10 minutes
 */
function tmdbFetch(endpoint, queryParams = {}) {
  // Build query string with api_key
  const params = new URLSearchParams({
    api_key: process.env.TMDB_API_KEY,
    ...Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== null)
    )
  });

  const path = `${TMDB_BASE_PATH}${endpoint}?${params.toString()}`;
  const cacheKey = path;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) return Promise.resolve(cached);

  // Retry wrapper
  const MAX_RETRIES = 3;

  function attempt(retryCount) {
    return new Promise((resolve, reject) => {
      let isRetrying = false;
      
      const req = https.get({
        hostname: TMDB_BASE_HOST,
        path: path,
        agent: agent,
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        timeout: 10000, // 10 second timeout
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(json.status_message || `TMDB API error: ${res.statusCode}`));
            } else {
              setCache(cacheKey, json);
              resolve(json);
            }
          } catch (e) {
            reject(new Error(`Failed to parse TMDB response: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        if (isRetrying) return;
        isRetrying = true;
        
        if (retryCount < MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 300; // 300ms, 600ms, 1200ms
          console.warn(`TMDB retry ${retryCount + 1}/${MAX_RETRIES} for ${endpoint} after ${delay}ms (${err.message})`);
          setTimeout(() => {
            attempt(retryCount + 1).then(resolve, reject);
          }, delay);
        } else {
          reject(new Error(`TMDB request failed after ${MAX_RETRIES} retries: ${err.message}`));
        }
      });

      req.on('timeout', () => {
        // This will trigger req.on('error') with "socket hang up"
        req.destroy(new Error('timeout'));
      });
    });
  }

  return attempt(0);
}

// ─── Image Proxy ─────────────────────────────────────────────
/**
 * GET /api/tmdb/image/:size/*
 * Proxies TMDB images through backend to bypass client-side DNS/ISP blocks & CORS.
 */
router.get('/image/:size/*', (req, res) => {
  const { size } = req.params;
  const imagePath = req.params[0];

  if (!imagePath) {
    return res.status(400).json({ error: 'Image path is required.' });
  }

  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const tmdbUrl = `https://image.tmdb.org/t/p/${size}${cleanPath}`;

  const imageReq = https.get(tmdbUrl, {
    agent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    },
    timeout: 10000
  }, (tmdbRes) => {
    if (tmdbRes.statusCode !== 200) {
      tmdbRes.resume();
      return res.status(tmdbRes.statusCode).end();
    }

    res.setHeader('Content-Type', tmdbRes.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    tmdbRes.pipe(res);
  });

  imageReq.on('timeout', () => {
    imageReq.destroy(new Error('timeout'));
  });

  imageReq.on('error', (err) => {
    console.error('Image proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).end();
    }
  });
});

// ─── Trending ────────────────────────────────────────────────
/**
 * GET /api/tmdb/trending/:mediaType/:timeWindow
 * mediaType: all, movie, tv, person
 * timeWindow: day, week
 */
router.get('/trending/:mediaType/:timeWindow', async (req, res) => {
  try {
    const { mediaType, timeWindow } = req.params;
    const { page } = req.query;
    const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { page });
    res.json(data);
  } catch (err) {
    console.error('Trending error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Movies ──────────────────────────────────────────────────
router.get('/movie/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movie/top_rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movie/upcoming', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/upcoming', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movie/now_playing', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/now_playing', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tmdb/movie/:id
 * Get movie details with credits, videos, similar, and recommendations
 */
router.get('/movie/:id', async (req, res) => {
  try {
    const data = await tmdbFetch(`/movie/${req.params.id}`, {
      append_to_response: 'credits,videos,similar,recommendations'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TV Shows ────────────────────────────────────────────────
router.get('/tv/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tv/top_rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/top_rated', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tv/on_the_air', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/on_the_air', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tv/airing_today', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/airing_today', { page: req.query.page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tmdb/tv/:id
 * Get TV show details with credits, videos, similar, and recommendations
 */
router.get('/tv/:id', async (req, res) => {
  try {
    const data = await tmdbFetch(`/tv/${req.params.id}`, {
      append_to_response: 'credits,videos,similar,recommendations'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Search ──────────────────────────────────────────────────
router.get('/search/multi', async (req, res) => {
  try {
    const { query, page } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }
    const data = await tmdbFetch('/search/multi', { query, page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search/movie', async (req, res) => {
  try {
    const { query, page } = req.query;
    const data = await tmdbFetch('/search/movie', { query, page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search/tv', async (req, res) => {
  try {
    const { query, page } = req.query;
    const data = await tmdbFetch('/search/tv', { query, page });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Discover ────────────────────────────────────────────────
router.get('/discover/:mediaType', async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { page, with_genres, sort_by, year } = req.query;
    const data = await tmdbFetch(`/discover/${mediaType}`, {
      page,
      with_genres,
      sort_by: sort_by || 'popularity.desc',
      year
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Genres ──────────────────────────────────────────────────
router.get('/genre/movie/list', async (req, res) => {
  try {
    const data = await tmdbFetch('/genre/movie/list');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/genre/tv/list', async (req, res) => {
  try {
    const data = await tmdbFetch('/genre/tv/list');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
