
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const storedUser = localStorage.getItem('citaPlannerUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Ensure branch ID is available for API calls immediately
          if (parsedUser.branchId) {
             localStorage.setItem('aurum_branch_id', parsedUser.branchId);
          }
        }
      } catch (e) {
        console.warn('LocalStorage access restricted:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, []);

  const login = async (phone: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const apiUser = await api.login(phone, pass);
      
      if (apiUser) {
        setUser(apiUser);
        localStorage.setItem('citaPlannerUser', JSON.stringify(apiUser));
        if (apiUser.branchId) {
            localStorage.setItem('aurum_branch_id', apiUser.branchId);
        }
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('citaPlannerUser');
      localStorage.removeItem('aurum_branch_id');
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

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePassword, isAuthenticated: !!user, isLoading }}>
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
