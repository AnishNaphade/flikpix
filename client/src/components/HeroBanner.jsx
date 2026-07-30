import { useState, useEffect, useCallback } from 'react';
import { getBackdropUrl } from '../services/api';
import { truncateText, getTitle, getReleaseDate, getYear, formatRating, getRatingColor } from '../utils/helpers';
import './HeroBanner.css';

export default function HeroBanner({ items = [], onMoreInfo }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Filter items with backdrop images
  const validItems = items.filter(item => item.backdrop_path).slice(0, 8);
  const current = validItems[currentIndex];

  // Auto-rotate
  useEffect(() => {
    if (validItems.length <= 1) return;
    const interval = setInterval(() => {
      goToNext();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentIndex, validItems.length]);

  const goToSlide = useCallback((index) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setImageLoaded(false);
    setImageError(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 400);
  }, [currentIndex, isTransitioning]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % validItems.length;
    goToSlide(nextIndex);
  }, [currentIndex, validItems.length, goToSlide]);

  if (!current) {
    return <div className="hero-banner hero-banner--skeleton skeleton" />;
  }

  const backdropUrl = getBackdropUrl(current.backdrop_path);
  const title = getTitle(current);
  const year = getYear(getReleaseDate(current));
  const rating = current.vote_average;
  const overview = truncateText(current.overview, 200);

  return (
    <section className="hero-banner" id="hero-banner">
      {/* Background Image */}
      <div className={`hero-banner__bg ${isTransitioning ? 'hero-banner__bg--fading' : ''}`}>
        {backdropUrl && !imageError && (
          <img
            src={backdropUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className={`hero-banner__img ${imageLoaded ? 'hero-banner__img--loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="hero-banner__gradient-bottom" />
      <div className="hero-banner__gradient-left" />
      <div className="hero-banner__vignette" />

      {/* Content */}
      <div className={`hero-banner__content ${isTransitioning ? 'hero-banner__content--fading' : ''}`}>
        <h1 className="hero-banner__title" id="hero-title">{title}</h1>

        <div className="hero-banner__meta">
          {rating > 0 && (
            <span className="hero-banner__rating" style={{ color: getRatingColor(rating) }}>
              ★ {formatRating(rating)}
            </span>
          )}
          {rating > 0 && year && <span className="hero-banner__separator">•</span>}
          {year && <span className="hero-banner__year">{year}</span>}
          
          {(year || rating > 0) && <span className="hero-banner__separator">•</span>}
          <span className="hero-banner__badge">
            {current.media_type === 'tv' || current.first_air_date ? 'TV Show' : 'Movie'}
          </span>
        </div>

        {overview && (
          <p className="hero-banner__overview">{overview}</p>
        )}

        <div className="hero-banner__actions">
          <button className="hero-banner__btn hero-banner__btn--play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          
          <button
            className="hero-banner__btn hero-banner__btn--more"
            onClick={() => onMoreInfo?.(current)}
            id="hero-more-info"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            See More
          </button>
        </div>
      </div>

      {/* Pagination Dots */}
      {validItems.length > 1 && (
        <div className="hero-banner__dots">
          {validItems.map((_, index) => (
            <button
              key={index}
              className={`hero-banner__dot ${index === currentIndex ? 'hero-banner__dot--active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
