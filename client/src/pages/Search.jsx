import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tmdbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUserLists } from '../hooks/useUserLists';
import ContentCard from '../components/ContentCard';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import './Pages.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const { isAuthenticated } = useAuth();
  const { addToList } = useUserLists();

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    tmdbAPI.searchMulti(query)
      .then(data => {
        setResults(data.results?.filter(r => r.media_type !== 'person') || []);
      })
      .catch(err => console.error('Search error:', err))
      .finally(() => setLoading(false));
  }, [query]);

  const filteredResults = results.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movies') return item.media_type === 'movie';
    if (activeFilter === 'tv') return item.media_type === 'tv';
    return true;
  });

  const handleAddToList = async (item, listType) => {
    if (!isAuthenticated) {
      showToast('Please sign in to manage your lists.', 'info');
      return;
    }
    const success = await addToList(item, listType);
    if (success) {
      const labels = { favorite: 'Favorites', must_watch: 'Must Watch', watched: 'Watched' };
      showToast(`Added to ${labels[listType]}! ✨`, 'success');
    } else {
      showToast('Already in this list or failed to add.', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'movies', label: 'Movies' },
    { key: 'tv', label: 'TV Shows' },
  ];

  return (
    <div className="page" id="page-search">
      <div className="page__header">
        <h1 className="page__title">
          {query ? `Search Results for "${query}"` : 'Search'}
        </h1>
        <p className="page__subtitle">
          {loading ? 'Searching...' : `${filteredResults.length} results found`}
        </p>
      </div>

      {results.length > 0 && (
        <div className="page__tabs">
          {filters.map(f => (
            <button
              key={f.key}
              className={`page__tab ${activeFilter === f.key ? 'page__tab--active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="page__loading">
          <div className="spinner" />
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="content-grid">
          {filteredResults.map((item, index) => (
            <ContentCard
              key={`${item.id}-${index}`}
              item={item}
              onCardClick={setSelectedItem}
              onAddToList={handleAddToList}
            />
          ))}
        </div>
      ) : query ? (
        <div className="page__empty">
          <div className="page__empty-icon">🔍</div>
          <h3 className="page__empty-title">No results found</h3>
          <p className="page__empty-text">Try different keywords or check the spelling.</p>
        </div>
      ) : (
        <div className="page__empty">
          <div className="page__empty-icon">🎬</div>
          <h3 className="page__empty-title">Search for Movies & TV Shows</h3>
          <p className="page__empty-text">Use the search bar above to find your favorite content.</p>
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
    </div>
  );
}
