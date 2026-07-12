import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        if (!query) setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className={`search-bar ${isOpen ? 'search-bar--open' : ''}`} ref={wrapperRef} id="search-bar">
      <button
        className="search-bar__icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search"
        id="search-toggle"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <form onSubmit={handleSubmit} className="search-bar__form">
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="Search movies, TV shows..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          id="search-input"
        />
        {query && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>
    </div>
  );
}
