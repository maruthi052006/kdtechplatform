// Auth Context with Authoritative Server Verification
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { syncService } from '../services/syncService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const refreshed = await authService.refreshCurrentUser();
        if (isMounted) {
          setUser(refreshed);
          if (refreshed?.role) {
            syncService.syncAll(refreshed.role).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('AuthContext init error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const loginAdmin = async (username, password) => {
    const session = await authService.loginAdmin(username, password);
    setUser(session);
    return session;
  };

  const loginStudent = async (identifier, password) => {
    const session = await authService.loginStudent(identifier, password);
    setUser(session);
    return session;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const refreshed = await authService.refreshCurrentUser();
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
