
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<User | null>;
  logout: () => void;
  updatePassword: (current: string, next: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('citaPlannerUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Auth Sync Error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (phone: string, pass: string): Promise<User | null> => {
    const apiUser = await api.login(phone, pass);
    if (apiUser) {
      setUser(apiUser);
      try {
        localStorage.setItem('citaPlannerUser', JSON.stringify(apiUser));
      } catch (e) {
        console.warn('Storage Error:', e);
      }
      return apiUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('citaPlannerUser');
    } catch (e) {
      console.warn('Storage Cleanup Error:', e);
    }
  };

  const updatePassword = async (current: string, next: string): Promise<boolean> => {
    if (!user) return false;
    return await api.updatePassword(user.id, current, next);
  };

  const value = {
    user,
    login,
    logout,
    updatePassword,
    isAuthenticated: !!user
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
