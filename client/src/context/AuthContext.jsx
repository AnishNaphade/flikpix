import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('flikpix_token');
    if (token) {
      authAPI.getMe()
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('flikpix_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem('flikpix_token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signup = useCallback(async (username, email, password) => {
    setError(null);
    try {
      const data = await authAPI.signup(username, email, password);
      localStorage.setItem('flikpix_token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('flikpix_token');
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
