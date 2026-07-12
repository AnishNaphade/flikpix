import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer__content">
        <div className="footer__brand">
          <span className="footer__logo">FLIKPIX</span>
          <p className="footer__tagline">Your Movie & TV Universe</p>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <h4>Browse</h4>
            <a href="/">Home</a>
            <a href="/movies">Movies</a>
            <a href="/tv">TV Shows</a>
          </div>
          <div className="footer__col">
            <h4>Account</h4>
            <a href="/my-list">My List</a>
            <a href="/login">Sign In</a>
          </div>
          <div className="footer__col">
            <h4>Info</h4>
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
            <a href="https://developer.themoviedb.org/" target="_blank" rel="noopener noreferrer">API Docs</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            Data provided by{' '}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="footer__tmdb-link">
              The Movie Database (TMDB)
            </a>
          </p>
          <p className="footer__copyright">© {new Date().getFullYear()} Flikpix. Built with ❤️</p>
        </div>
      </div>
    </footer>
  );
}
