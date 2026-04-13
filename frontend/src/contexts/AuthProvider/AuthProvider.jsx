import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../services/authApi';
import { AuthContext } from '../authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authApi.getMe();
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

  const login = useCallback(async (phone) => {
    const res = await authApi.login(phone);
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
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
