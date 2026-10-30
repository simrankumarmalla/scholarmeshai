import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('scholarmesh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('scholarmesh_token'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axiosClient.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setStats(res.data.stats);
        localStorage.setItem('scholarmesh_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Session check failed or expired');
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('scholarmesh_token', newToken);
      localStorage.setItem('scholarmesh_user', JSON.stringify(newUser));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const demoLogin = async () => {
    return await login('demo@scholarmesh.ai', 'DemoPass123!');
  };

  const register = async (userData) => {
    const res = await axiosClient.post('/auth/register', userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('scholarmesh_token', newToken);
      localStorage.setItem('scholarmesh_user', JSON.stringify(newUser));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStats(null);
    localStorage.removeItem('scholarmesh_token');
    localStorage.removeItem('scholarmesh_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        loading,
        login,
        demoLogin,
        register,
        logout,
        refreshProfile: fetchCurrentUser,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
