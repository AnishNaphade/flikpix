import './SkeletonLoader.css';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton-card__poster skeleton" />
      </div>
    );
  }

  if (type === 'carousel') {
    return (
      <div className="skeleton-carousel">
        <div className="skeleton-carousel__title skeleton" />
        <div className="skeleton-carousel__track">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-card__poster skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className="skeleton-hero skeleton" />
    );
  }

  if (type === 'detail') {
    return (
      <div className="skeleton-detail">
        <div className="skeleton-detail__header skeleton" />
        <div className="skeleton-detail__body">
          <div className="skeleton-detail__line skeleton" style={{ width: '60%' }} />
          <div className="skeleton-detail__line skeleton" style={{ width: '80%' }} />
          <div className="skeleton-detail__line skeleton" style={{ width: '45%' }} />
        </div>
      </div>
    );
  }

  return null;
}
