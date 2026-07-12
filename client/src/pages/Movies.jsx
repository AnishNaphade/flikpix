import { useState, useEffect } from 'react';
import { tmdbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUserLists } from '../hooks/useUserLists';
import HeroBanner from '../components/HeroBanner';
import ContentCarousel from '../components/ContentCarousel';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import './Pages.css';

export default function Movies() {
  const [nowPlaying, setNowPlaying] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const { isAuthenticated } = useAuth();
  const { addToList } = useUserLists();

  useEffect(() => {
    async function fetchData() {
      try {
        const results = await Promise.allSettled([
          tmdbAPI.getNowPlayingMovies(),
          tmdbAPI.getPopularMovies(),
          tmdbAPI.getTopRatedMovies(),
          tmdbAPI.getUpcomingMovies(),
          tmdbAPI.discover('movie', { with_genres: '28', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('movie', { with_genres: '35', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('movie', { with_genres: '878', sort_by: 'popularity.desc' }),
          tmdbAPI.discover('movie', { with_genres: '27', sort_by: 'popularity.desc' }),
        ]);
        const extract = (r) => r.status === 'fulfilled' ? (r.value.results || []) : [];
        setNowPlaying(extract(results[0]));
        setPopular(extract(results[1]));
        setTopRated(extract(results[2]));
        setUpcoming(extract(results[3]));
        setActionMovies(extract(results[4]));
        setComedyMovies(extract(results[5]));
        setSciFiMovies(extract(results[6]));
        setHorrorMovies(extract(results[7]));
      } catch (err) {
        console.error('Failed to fetch movies:', err);
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
    const success = await addToList({ ...item, media_type: 'movie' }, listType);
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
    <div className="page" id="page-movies">
      <HeroBanner items={popular.slice(0, 6)} onMoreInfo={setSelectedItem} />

      <div className="page__carousels">
        <ContentCarousel title="🎬 Now Playing" items={nowPlaying} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🔥 Popular Movies" items={popular} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="⭐ Top Rated" items={topRated} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🎥 Coming Soon" items={upcoming} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="💥 Action" items={actionMovies} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="😂 Comedy" items={comedyMovies} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="🚀 Sci-Fi" items={sciFiMovies} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
        <ContentCarousel title="👻 Horror" items={horrorMovies} loading={loading} onCardClick={setSelectedItem} onAddToList={handleAddToList} />
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
