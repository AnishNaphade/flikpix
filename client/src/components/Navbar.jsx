import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/movies', label: 'Movies' },
    { path: '/tv', label: 'TV Shows' },
    { path: '/my-list', label: 'My List' },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
      <div className="navbar__content">
        {/* Logo */}
        <Link to="/" className="navbar__logo" id="navbar-logo">
          <span className="navbar__logo-text">FLIKPIX</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="navbar__links">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                id={`nav-link-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Side */}
        <div className="navbar__right">
          <SearchBar />

          {isAuthenticated ? (
            <div className="navbar__user-menu-wrapper">
              <button
                className="navbar__avatar"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                id="user-avatar-btn"
                style={{ background: user?.avatar_color || '#E50914' }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </button>

              {userMenuOpen && (
                <div className="navbar__user-dropdown animate-fadeInDown" id="user-dropdown">
                  <div className="navbar__user-info">
                    <div
                      className="navbar__user-avatar-lg"
                      style={{ background: user?.avatar_color || '#E50914' }}
                    >
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="navbar__user-name">{user?.username}</p>
                      <p className="navbar__user-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="navbar__dropdown-divider" />
                  <Link to="/my-list" className="navbar__dropdown-item" id="dropdown-my-list">
                    <span>📋</span> My List
                  </Link>
                  <button className="navbar__dropdown-item" onClick={handleLogout} id="dropdown-logout">
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar__sign-in" id="nav-sign-in">
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={`navbar__hamburger ${mobileMenuOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu animate-fadeInDown" id="mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar__mobile-link ${location.pathname === link.path ? 'navbar__mobile-link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link to="/login" className="navbar__mobile-link">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
