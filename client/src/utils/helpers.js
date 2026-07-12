/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get the year from a date string
 */
export function getYear(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear();
}

/**
 * Format runtime minutes to hours and minutes
 */
export function formatRuntime(minutes) {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/**
 * Format vote average to a displayable rating
 */
export function formatRating(rating) {
  if (!rating) return 'N/A';
  return Number(rating).toFixed(1);
}

/**
 * Get rating color based on score
 */
export function getRatingColor(rating) {
  if (rating >= 8) return '#46d369';
  if (rating >= 6.5) return '#f5c518';
  if (rating >= 5) return '#e87c03';
  return '#E50914';
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get content type label
 */
export function getContentTypeLabel(item) {
  if (item.media_type === 'movie' || item.title) return 'Movie';
  if (item.media_type === 'tv' || item.name) return 'TV Show';
  return 'Content';
}

/**
 * Get the title from a content item (handles both movie and TV)
 */
export function getTitle(item) {
  return item.title || item.name || 'Untitled';
}

/**
 * Get the release date from a content item
 */
export function getReleaseDate(item) {
  return item.release_date || item.first_air_date || '';
}

/**
 * Determine content type from item data
 */
export function getContentType(item) {
  if (item.media_type) return item.media_type;
  if (item.content_type) return item.content_type;
  if (item.first_air_date || item.number_of_seasons) return 'tv';
  return 'movie';
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString();
}

/**
 * Generate a placeholder color based on string
 */
export function stringToColor(str) {
  if (!str) return '#E50914';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#E50914', '#00a8e1', '#46d369', '#e87c03', '#6d56c1', '#f5c518'];
  return colors[Math.abs(hash) % colors.length];
}
