import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="page-signup">
      <div className="auth-card animate-scaleIn">
        <h1 className="auth-card__logo">FLIKPIX</h1>
        <h2 className="auth-card__title">Create Your Account</h2>

        <form onSubmit={handleSubmit} className="auth-card__form" id="signup-form">
          {error && <div className="auth-card__error">{error}</div>}

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              className="auth-card__input"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="auth-card__input"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="auth-card__input"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              className="auth-card__input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-card__submit"
            disabled={loading}
            id="signup-submit"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
