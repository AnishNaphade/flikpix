import { useState, useEffect } from 'react';
import { tmdbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUserLists } from '../hooks/useUserLists';
import HeroBanner from '../components/HeroBanner';
import ContentCarousel from '../components/ContentCarousel';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import './Pages.css';

export default function TvShows() {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [onTheAir, setOnTheAir] = useState([]);
  const [airingToday, setAiringToday] = useState([]);
  const [dramaTV, setDramaTV] = useState([]);
  const [crimeTV, setCrimeTV] = useState([]);
  const [animationTV, setAnimationTV] = useState([]);
  const [docuTV, setDocuTV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const { isAuthenticated } = useAuth();
  const { addToList } = useUserLists();

  useEffect(() => {
    async function fetchData() {
      try {
        const results = await Promise.allSettled([
          tmdbAPI.getPopularTV(),
          tmdbAPI.getTopRatedTV(),
          tmdbAPI.getOnTheAirTV(),
          tmdbAPI.getAiringTodayTV(),
          tmdbAPI.discover('tv', { with_genres: '18', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('tv', { with_genres: '80', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('tv', { with_genres: '16', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('tv', { with_genres: '99', sort_by: 'popularity.desc' }),
        ]);
        const extract = (r) => r.status === 'fulfilled' ? (r.value.results || []) : [];
        setPopular(extract(results[0]));
        setTopRated(extract(results[1]));
        setOnTheAir(extract(results[2]));
        setAiringToday(extract(results[3]));
        setDramaTV(extract(results[4]));
        setCrimeTV(extract(results[5]));
        setAnimationTV(extract(results[6]));
        setDocuTV(extract(results[7]));
      } catch (err) {
        console.error('Failed to fetch TV shows:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToList = async (item, listType) => {
    if (!isAuthenticated) {
      showToast('Please sign in to manage your lists.', 'info');
      return;
    }
    const success = await addToList({ ...item, media_type: 'tv' }, listType);
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

  return (
    <div className="page" id="page-tv">
      <HeroBanner items={popular.slice(0, 6)} onMoreInfo={setSelectedItem} />

      <div className="page__carousels">
        <ContentCarousel title="📺 Popular TV Shows" items={popular} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🔴 Airing Today" items={airingToday} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="📡 On The Air" items={onTheAir} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="⭐ Top Rated" items={topRated} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🎭 Drama" items={dramaTV} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🔍 Crime" items={crimeTV} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="✨ Animation" items={animationTV} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="📖 Documentary" items={docuTV} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
      </div>

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
