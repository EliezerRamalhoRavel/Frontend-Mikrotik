import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/api';
import { api } from '@/lib/axios';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('@mikrotik_web:token');
    localStorage.removeItem('@mikrotik_web:user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('@mikrotik_web:token');
      const storedUser = localStorage.getItem('@mikrotik_web:user');

      if (storedToken && storedUser) {
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const handleAuthError = () => {
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('@mikrotik_web:token', token);
    localStorage.setItem('@mikrotik_web:user', JSON.stringify(userData));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};