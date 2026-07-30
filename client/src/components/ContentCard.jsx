import { useState } from 'react';
import { getImageUrl } from '../services/api';
import { getTitle, getReleaseDate, getYear, formatRating, getRatingColor, truncateText, getContentType } from '../utils/helpers';
import './ContentCard.css';

export default function ContentCard({ item, onCardClick, onAddToList, isTop10, style }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!item) return null;

  const posterUrl = getImageUrl(item.poster_path, 'w342');
  const title = getTitle(item);
  const year = getYear(getReleaseDate(item));
  const rating = item.vote_average;
  const contentType = getContentType(item);

  return (
    <div
      className={`content-card ${isHovered ? 'content-card--hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick?.(item)}
      style={style}
      role="button"
      tabIndex={0}
      id={`card-${contentType}-${item.id}`}
    >
      {/* Poster Image Container */}
      <div className="content-card__poster-container">
        {!imageLoaded && !imageError && <div className="content-card__skeleton skeleton" />}
        
        {isTop10 && (
          <div className="content-card__top10-badge">
            <span className="top10-text">TOP</span>
            <span className="top10-number">10</span>
          </div>
        )}

        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className={`content-card__img ${imageLoaded ? 'content-card__img--loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="content-card__no-poster">
            <span>🎬</span>
            <span className="content-card__no-poster-title">{title}</span>
          </div>
        )}

        {/* Simple hover overlay just for the play icon */}
        <div className="content-card__poster-overlay">
          <div className="content-card__play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Metadata Text Below */}
      <div className="content-card__info">
        <h4 className="content-card__title" title={title}>{title}</h4>
        <div className="content-card__meta">
          {rating > 0 && (
            <span className="content-card__rating" style={{ color: getRatingColor(rating) }}>
              ★ {formatRating(rating)}
            </span>
          )}
          {year && <span className="content-card__year">{year}</span>}
          <span className="content-card__type">
            {contentType === 'movie' ? 'Movie' : 'TV Show'}
          </span>
        </div>
      </div>
    </div>
  );
}
