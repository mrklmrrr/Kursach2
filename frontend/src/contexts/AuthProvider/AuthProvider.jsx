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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkAuthDone = useRef(false);

  useEffect(() => {
    // Skip if already checked
    if (checkAuthDone.current) return;
    checkAuthDone.current = true;

    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
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
          setToken(null);
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
    const token = res.data.token;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const loginAdmin = useCallback(async (email, password) => {
    const res = await adminApi.login(email, password);
    const token = res.data.token;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await authApi.register(userData);
    const token = res.data.token;
    localStorage.setItem('token', token);
    setToken(token);
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
    setToken(null);
    userCache = null;
    cacheTimestamp = 0;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginAdmin, register, updateUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
