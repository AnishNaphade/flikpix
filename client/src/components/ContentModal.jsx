import { useState, useEffect } from 'react';
import { tmdbAPI, getBackdropUrl, getProfileUrl, getImageUrl } from '../services/api';
import { getTitle, getReleaseDate, getYear, formatRating, getRatingColor, formatRuntime, formatDate, getContentType } from '../utils/helpers';
import ContentCard from './ContentCard';
import './ContentModal.css';

export default function ContentModal({ item, onClose, onAddToList }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const contentType = getContentType(item);

  useEffect(() => {
    if (!item) return;
    setLoading(true);

    const fetchDetails = contentType === 'tv'
      ? tmdbAPI.getTVDetails(item.id || item.content_id)
      : tmdbAPI.getMovieDetails(item.id || item.content_id);

    fetchDetails
      .then(data => setDetails(data))
      .catch(err => console.error('Failed to load details:', err))
      .finally(() => setLoading(false));
  }, [item, contentType]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!item) return null;

  const data = details || item;
  const title = getTitle(data);
  const year = getYear(getReleaseDate(data));
  const rating = data.vote_average;
  const backdropUrl = getBackdropUrl(data.backdrop_path);
  const genres = data.genres || [];
  const runtime = data.runtime;
  const overview = data.overview;
  const tagline = data.tagline;

  // Cast
  const cast = details?.credits?.cast?.slice(0, 12) || [];

  // Trailer
  const trailer = details?.videos?.results?.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  ) || details?.videos?.results?.find(v => v.site === 'YouTube');

  // Similar
  const similar = details?.similar?.results?.slice(0, 10) || [];

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose} id="content-modal-overlay">
      <div className="modal animate-scaleIn" onClick={e => e.stopPropagation()} id="content-modal">
        {/* Close Button */}
        <button className="modal__close" onClick={onClose} id="modal-close-btn" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Backdrop Header */}
        <div className="modal__header">
          {backdropUrl && (
            <img src={backdropUrl} alt={title} className="modal__backdrop" />
          )}
          <div className="modal__header-gradient" />
          <div className="modal__header-content">
            <h2 className="modal__title">{title}</h2>
            {tagline && <p className="modal__tagline">"{tagline}"</p>}
          </div>
        </div>

        {/* Meta Info */}
        <div className="modal__body">
          <div className="modal__meta-row">
            {rating > 0 && (
              <span className="modal__rating" style={{ color: getRatingColor(rating) }}>
                ★ {formatRating(rating)}
              </span>
            )}
            {year && <span className="modal__meta-item">{year}</span>}
            {runtime && <span className="modal__meta-item">{formatRuntime(runtime)}</span>}
            {contentType === 'tv' && data.number_of_seasons && (
              <span className="modal__meta-item">
                {data.number_of_seasons} Season{data.number_of_seasons !== 1 ? 's' : ''}
              </span>
            )}
            <span className="modal__type-badge">
              {contentType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
            </span>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="modal__genres">
              {genres.map(g => (
                <span key={g.id} className="modal__genre-tag">{g.name}</span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal__actions">
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="modal__btn modal__btn--play"
                id="modal-play-trailer"
              >
                ▶ Play Trailer
              </a>
            )}
            <button
              className="modal__btn modal__btn--secondary"
              onClick={() => onAddToList?.(data, 'favorite')}
              id="modal-add-favorite"
            >
              ❤️ Favorite
            </button>
            <button
              className="modal__btn modal__btn--secondary"
              onClick={() => onAddToList?.(data, 'must_watch')}
              id="modal-add-must-watch"
            >
              🔖 Must Watch
            </button>
            <button
              className="modal__btn modal__btn--secondary"
              onClick={() => onAddToList?.(data, 'watched')}
              id="modal-add-watched"
            >
              ✅ Watched
            </button>
          </div>

          {/* Tabs */}
          <div className="modal__tabs">
            {['overview', 'cast', 'similar'].map(tab => (
              <button
                key={tab}
                className={`modal__tab ${activeTab === tab ? 'modal__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="modal__tab-content">
            {activeTab === 'overview' && (
              <div className="modal__overview animate-fadeIn">
                <p>{overview || 'No overview available.'}</p>

                {details && (
                  <div className="modal__details-grid">
                    {data.status && (
                      <div className="modal__detail-item">
                        <span className="modal__detail-label">Status</span>
                        <span>{data.status}</span>
                      </div>
                    )}
                    {data.original_language && (
                      <div className="modal__detail-item">
                        <span className="modal__detail-label">Language</span>
                        <span>{data.original_language.toUpperCase()}</span>
                      </div>
                    )}
                    {data.budget > 0 && (
                      <div className="modal__detail-item">
                        <span className="modal__detail-label">Budget</span>
                        <span>${(data.budget / 1_000_000).toFixed(1)}M</span>
                      </div>
                    )}
                    {data.revenue > 0 && (
                      <div className="modal__detail-item">
                        <span className="modal__detail-label">Revenue</span>
                        <span>${(data.revenue / 1_000_000).toFixed(1)}M</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cast' && (
              <div className="modal__cast animate-fadeIn">
                {cast.length > 0 ? (
                  <div className="modal__cast-grid">
                    {cast.map(person => (
                      <div key={person.id} className="modal__cast-card">
                        <div className="modal__cast-photo">
                          {person.profile_path ? (
                            <img src={getProfileUrl(person.profile_path)} alt={person.name} />
                          ) : (
                            <div className="modal__cast-no-photo">👤</div>
                          )}
                        </div>
                        <p className="modal__cast-name">{person.name}</p>
                        <p className="modal__cast-character">{person.character}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="modal__empty">No cast information available.</p>
                )}
              </div>
            )}

            {activeTab === 'similar' && (
              <div className="modal__similar animate-fadeIn">
                {similar.length > 0 ? (
                  <div className="modal__similar-grid">
                    {similar.map(s => (
                      <div key={s.id} className="modal__similar-card" onClick={() => {
                        setDetails(null);
                        setLoading(true);
                        const fetchFn = (s.media_type === 'tv' || s.first_air_date) ? tmdbAPI.getTVDetails(s.id) : tmdbAPI.getMovieDetails(s.id);
                        fetchFn.then(d => { setDetails(d); setActiveTab('overview'); }).finally(() => setLoading(false));
                      }}>
                        {s.poster_path ? (
                          <img src={getImageUrl(s.poster_path, 'w185')} alt={getTitle(s)} />
                        ) : (
                          <div className="modal__similar-no-poster">🎬</div>
                        )}
                        <p>{getTitle(s)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="modal__empty">No similar content found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
