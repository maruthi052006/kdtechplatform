// Auth Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshed = authService.refreshCurrentUser();
    setUser(refreshed);
    setLoading(false);
  }, []);

  const loginAdmin = async (username, password) => {
    const session = authService.loginAdmin(username, password);
    setUser(session);
    return session;
  };

  const loginStudent = async (identifier, password) => {
    const session = authService.loginStudent(identifier, password);
    setUser(session);
    return session;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = () => {
    const refreshed = authService.refreshCurrentUser();
    setUser(refreshed);
    return refreshed;
  };

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isAuthenticated: !!user,
    loginAdmin,
    loginStudent,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
