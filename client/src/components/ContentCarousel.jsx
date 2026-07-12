import { useRef, useState } from 'react';
import ContentCard from './ContentCard';
import SkeletonLoader from './SkeletonLoader';
import './ContentCarousel.css';

export default function ContentCarousel({ 
  title, 
  items = [], 
  loading = false, 
  onCardClick, 
  onAddToList,
  isTop10 = false,
  tabs = [],
  activeTab = '',
  onTabChange
}) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 20);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className="carousel" id={`carousel-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="carousel__header">
        <h2 className="carousel__title">{title}</h2>
        
        {tabs && tabs.length > 0 && (
          <div className="carousel__tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`carousel__tab ${activeTab === tab.key ? 'carousel__tab--active' : ''}`}
                onClick={() => onTabChange?.(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="carousel__wrapper">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            className="carousel__arrow carousel__arrow--left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Scrollable Row */}
        <div
          className="carousel__track"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonLoader key={i} type="card" />
            ))
          ) : (
            items.map((item, index) => (
              <ContentCard
                key={`${item.id}-${index}`}
                item={item}
                onCardClick={onCardClick}
                onAddToList={onAddToList}
                isTop10={isTop10}
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))
          )}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            className="carousel__arrow carousel__arrow--right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
