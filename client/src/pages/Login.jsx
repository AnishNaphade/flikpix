import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="page-login">
      <div className="auth-card animate-scaleIn">
        <h1 className="auth-card__logo">FLIKPIX</h1>
        <h2 className="auth-card__title">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="auth-card__form" id="login-form">
          {error && <div className="auth-card__error">{error}</div>}

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="login-username">Username or Email</label>
            <input
              id="login-username"
              type="text"
              className="auth-card__input"
              placeholder="Enter your username or email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="auth-card__input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-card__submit"
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-card__footer">
          New to Flikpix? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
