import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi, adminApi } from '../../services/authApi';
import { AuthContext } from '../authContext';

// Cache for user data to avoid redundant getMe calls
let userCache = null;
let cacheTimestamp = 0;
const USER_CACHE_TTL = 60000; // 1 minute

function getCachedUser() {
  const now = Date.now();
  if (userCache && (now - cacheTimestamp) < USER_CACHE_TTL) {
    return userCache;
  }
  return null;
}

function setUserCache(user) {
  userCache = user;
  cacheTimestamp = Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkAuthDone = useRef(false);

  useEffect(() => {
    // Skip if already checked
    if (checkAuthDone.current) return;
    checkAuthDone.current = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Try cache first
        const cached = getCachedUser();
        if (cached) {
          setUser(cached);
          setLoading(false);
          return;
        }

        try {
          const res = await authApi.getMe();
          setUserCache(res.data);
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      window.location.href = '/login';
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (phone, password) => {
    const res = await authApi.login(phone, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const loginAdmin = useCallback(async (email, password) => {
    const res = await adminApi.login(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await authApi.register(userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const updateUser = useCallback(async (updates) => {
    const res = await authApi.updateUser(updates);
    setUserCache(res.data);
    setUser(res.data);
    return res.data;
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authApi.getMe();
    setUserCache(res.data);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    userCache = null;
    cacheTimestamp = 0;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAdmin, register, updateUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
