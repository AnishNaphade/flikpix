import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserLists } from '../hooks/useUserLists';
import ContentCard from '../components/ContentCard';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import './Pages.css';

export default function MyList() {
  const { user } = useAuth();
  const { lists, loading, fetchLists, removeFromList, addToList } = useUserLists();
  const [activeTab, setActiveTab] = useState('favorite');
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const tabs = [
    { key: 'favorite', label: '❤️ Favorites', emoji: '❤️' },
    { key: 'must_watch', label: '🔖 Must Watch', emoji: '🔖' },
    { key: 'watched', label: '✅ Watched', emoji: '✅' },
  ];

  const currentList = lists[activeTab] || [];

  // Transform list items for ContentCard
  const cardItems = currentList.map(item => ({
    id: item.content_id,
    title: item.title,
    name: item.content_type === 'tv' ? item.title : undefined,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    overview: item.overview,
    release_date: item.release_date,
    media_type: item.content_type,
    content_type: item.content_type,
    _listId: item.id,
  }));

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const handleAddToList = async (item, listType) => {
    const success = await addToList(item, listType);
    if (success) {
      const labels = { favorite: 'Favorites', must_watch: 'Must Watch', watched: 'Watched' };
      showToast(`Added to ${labels[listType]}! ✨`, 'success');
    } else {
      showToast('Already in this list or failed to add.', 'error');
    }
  };

  const handleRemove = async (item) => {
    const contentType = item.content_type || item.media_type;
    const contentId = item.content_id || item.id;
    const success = await removeFromList(contentType, contentId, activeTab);
    if (success) {
      showToast('Removed from list.', 'success');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page" id="page-my-list">
      <div className="page__header">
        <h1 className="page__title">My List</h1>
        <p className="page__subtitle">
          Welcome back, {user?.username}! Here are your saved titles.
        </p>
      </div>

      {/* Tabs */}
      <div className="page__tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`page__tab ${activeTab === tab.key ? 'page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {lists[tab.key]?.length > 0 && (
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>({lists[tab.key].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="page__loading">
          <div className="spinner" />
        </div>
      ) : cardItems.length > 0 ? (
        <div className="content-grid">
          {cardItems.map((item, index) => (
            <div key={`${item.id}-${index}`} style={{ position: 'relative' }}>
              <ContentCard
                item={item}
                onCardClick={handleCardClick}
                onAddToList={handleAddToList}
              />
              <button
                className="my-list__remove-btn"
                onClick={() => handleRemove(currentList[index])}
                title="Remove from list"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="page__empty">
          <div className="page__empty-icon">
            {tabs.find(t => t.key === activeTab)?.emoji}
          </div>
          <h3 className="page__empty-title">
            Your {tabs.find(t => t.key === activeTab)?.label.replace(/[^\w\s]/g, '').trim()} list is empty
          </h3>
          <p className="page__empty-text">
            Browse movies and TV shows to add them to this list.
          </p>
          <Link to="/" className="page__empty-btn">Browse Content</Link>
        </div>
      )}

      <Footer />

      {selectedItem && (
        <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToList={handleAddToList} />
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <style>{`
        .my-list__remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(229, 9, 20, 0.8);
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .content-grid > div:hover .my-list__remove-btn {
          opacity: 1;
        }
        .my-list__remove-btn:hover {
          background: rgba(229, 9, 20, 1);
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
