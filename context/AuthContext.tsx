
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<User | null>;
  logout: () => void;
  updatePassword: (current: string, next: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
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
          const parsedUser = JSON.parse(storedUser);
          // Verificar integridad básica (token existe)
          if (parsedUser.token) {
            setUser(parsedUser);
            socketService.connect();
          } else {
            localStorage.removeItem('citaPlannerUser'); // Limpiar auth corrupta
          }
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
    setIsLoading(true);
    try {
      const apiUser = await api.login(phone, pass);

      if (apiUser) {
        try {
          setUser(apiUser);
          localStorage.setItem('citaPlannerUser', JSON.stringify(apiUser));
          socketService.connect();
        } catch (e) {
          console.warn('Storage Error:', e);
        }
        return apiUser;
      }
      return null;
    } catch (e) {
      console.error('[AUTH CONTEXT] Login Error:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    socketService.disconnect();
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
    isAuthenticated: !!user,
    isLoading
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
