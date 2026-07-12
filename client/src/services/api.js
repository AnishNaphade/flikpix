const API_BASE = '/api';

/**
 * Base fetch wrapper with auth token injection, error handling, and retry logic.
 */
async function request(endpoint, options = {}, retries = 2) {
  const token = localStorage.getItem('flikpix_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (err) {
      if (attempt < retries) {
        // Wait before retrying (300ms, 600ms)
        await new Promise(r => setTimeout(r, (attempt + 1) * 300));
        continue;
      }
      throw err;
    }
  }
}

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
  signup: (username, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request('/auth/me'),
};

// ─── TMDB API ────────────────────────────────────────────────
export const tmdbAPI = {
  // Trending
  getTrending: (mediaType = 'all', timeWindow = 'day', page = 1) =>
    request(`/tmdb/trending/${mediaType}/${timeWindow}?page=${page}`),

  // Movies
  getPopularMovies: (page = 1) => request(`/tmdb/movie/popular?page=${page}`),
  getTopRatedMovies: (page = 1) => request(`/tmdb/movie/top_rated?page=${page}`),
  getUpcomingMovies: (page = 1) => request(`/tmdb/movie/upcoming?page=${page}`),
  getNowPlayingMovies: (page = 1) => request(`/tmdb/movie/now_playing?page=${page}`),
  getMovieDetails: (id) => request(`/tmdb/movie/${id}`),

  // TV Shows
  getPopularTV: (page = 1) => request(`/tmdb/tv/popular?page=${page}`),
  getTopRatedTV: (page = 1) => request(`/tmdb/tv/top_rated?page=${page}`),
  getOnTheAirTV: (page = 1) => request(`/tmdb/tv/on_the_air?page=${page}`),
  getAiringTodayTV: (page = 1) => request(`/tmdb/tv/airing_today?page=${page}`),
  getTVDetails: (id) => request(`/tmdb/tv/${id}`),

  // Search
  searchMulti: (query, page = 1) =>
    request(`/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${page}`),
  searchMovies: (query, page = 1) =>
    request(`/tmdb/search/movie?query=${encodeURIComponent(query)}&page=${page}`),
  searchTV: (query, page = 1) =>
    request(`/tmdb/search/tv?query=${encodeURIComponent(query)}&page=${page}`),

  // Discover
  discover: (mediaType, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tmdb/discover/${mediaType}?${query}`);
  },

  // Genres
  getMovieGenres: () => request('/tmdb/genre/movie/list'),
  getTVGenres: () => request('/tmdb/genre/tv/list'),
};

// ─── Lists API ───────────────────────────────────────────────
export const listsAPI = {
  getAll: () => request('/lists'),
  
  getByType: (listType) => request(`/lists/${listType}`),
  
  addItem: (item) =>
    request('/lists', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  
  removeItem: (id) =>
    request(`/lists/${id}`, { method: 'DELETE' }),
  
  removeByContent: (contentType, contentId, listType) =>
    request(`/lists/item/${contentType}/${contentId}/${listType}`, { method: 'DELETE' }),
  
  checkItem: (contentType, contentId) =>
    request(`/lists/check/${contentType}/${contentId}`),
};

// ─── TMDB Image Helpers ──────────────────────────────────────
const IMG_BASE = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path, size = 'original') => {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
};

export const getProfileUrl = (path, size = 'w185') => {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
};
