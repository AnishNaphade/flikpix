import { useState, useEffect } from 'react';
import { tmdbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUserLists } from '../hooks/useUserLists';
import HeroBanner from '../components/HeroBanner';
import ContentCarousel from '../components/ContentCarousel';
import ContentModal from '../components/ContentModal';
import Footer from '../components/Footer';
import './Pages.css';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [trendingTab, setTrendingTab] = useState('movie');
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [top10, setTop10] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTV, setTopRatedTV] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);

  const { isAuthenticated } = useAuth();
  const { addToList } = useUserLists();

  // Fetch static page data
  useEffect(() => {
    async function fetchStaticData() {
      try {
        const results = await Promise.allSettled([
          tmdbAPI.getPopularMovies(),
          tmdbAPI.getPopularTV(),
          tmdbAPI.getTopRatedMovies(),
          tmdbAPI.getTopRatedTV(),
          tmdbAPI.getUpcomingMovies(),
        ]);
        
        const extract = (r) => r.status === 'fulfilled' ? (r.value.results || []) : [];
        
        const popMoviesData = extract(results[0]);
        setTop10(popMoviesData.slice(0, 10));
        setPopularMovies(popMoviesData);
        setPopularTV(extract(results[1]));
        setTopRatedMovies(extract(results[2]));
        setTopRatedTV(extract(results[3]));
        setUpcoming(extract(results[4]));
      } catch (err) {
        console.error('Failed to fetch home static data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStaticData();
  }, []);

  // Fetch trending data when tab changes
  useEffect(() => {
    async function fetchTrending() {
      setTrendingLoading(true);
      try {
        const res = await tmdbAPI.getTrending(trendingTab, 'day');
        setTrending(res.results || []);
      } catch (err) {
        console.error('Failed to fetch trending data:', err);
      } finally {
        setTrendingLoading(false);
      }
    }
    fetchTrending();
  }, [trendingTab]);

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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page page--home" id="page-home">
      <HeroBanner
        items={upcoming.slice(0, 8)} // Using upcoming for hero to ensure high res posters
        onMoreInfo={setSelectedItem}
      />

      <div className="page__carousels">
        <ContentCarousel
          title="Top 10 Today"
          items={top10}
          loading={loading}
          isTop10={true}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
        <ContentCarousel
          title="Trending Today"
          items={trending}
          loading={trendingLoading}
          tabs={[
            { key: 'movie', label: 'Movies' },
            { key: 'tv', label: 'Series' }
          ]}
          activeTab={trendingTab}
          onTabChange={setTrendingTab}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
        <ContentCarousel
          title="Popular Movies"
          items={popularMovies}
          loading={loading}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
        <ContentCarousel
          title="Popular Series"
          items={popularTV}
          loading={loading}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
        <ContentCarousel
          title="Top Rated Movies"
          items={topRatedMovies}
          loading={loading}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
        <ContentCarousel
          title="Upcoming Movies"
          items={upcoming}
          loading={loading}
          onCardClick={setSelectedItem}
          onAddToList={handleAddToList}
        />
      </div>

      <Footer />

      {/* Content Modal */}
      {selectedItem && (
        <ContentModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToList={handleAddToList}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
