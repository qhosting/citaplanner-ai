
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
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
        console.warn('LocalStorage access restricted:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (phone: string, pass: string): Promise<boolean> => {
    const apiUser = await api.login(phone, pass);
    
    if (apiUser) {
      setUser(apiUser);
      localStorage.setItem('citaPlannerUser', JSON.stringify(apiUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('citaPlannerUser');
    } catch (e) {
      console.warn('LocalStorage access restricted:', e);
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    // Simulación de cambio de password
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Password updated for user ${user?.phone} (Simulation)`);
    return true;
  };

  const value = {
    user,
    login,
    logout,
    updatePassword,
    isAuthenticated: !!user
  };

  if (isLoading) {
    return null; // O un spinner de carga global
  }

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
