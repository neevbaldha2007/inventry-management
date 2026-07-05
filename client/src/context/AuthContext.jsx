import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ims_token');
    const savedUser = localStorage.getItem('ims_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('ims_token', data.token);
    localStorage.setItem('ims_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup(name, email, password);
    localStorage.setItem('ims_token', data.token);
    localStorage.setItem('ims_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('ims_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
