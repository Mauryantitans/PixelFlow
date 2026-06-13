import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterRequest } from '../types';
import { authService } from '../services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    // Get session ID from localStorage
    return localStorage.getItem('pixelflow_session_id') || '';
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          authService.clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authResponse = await authService.login(email, password);
      authService.setTokens(authResponse.access_token, authResponse.refresh_token);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authService.register(data);
      // Auto-login after registration
      await login(data.email, data.password);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await authService.logout(sessionId);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    setUser,
    setToken: (token: string) => {
      authService.setTokens(token, '');
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
