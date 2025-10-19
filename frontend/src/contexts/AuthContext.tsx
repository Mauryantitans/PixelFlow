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
      console.log('🔐 Auth init - token exists:', !!token);
      
      if (token) {
        try {
          console.log('📡 Fetching current user...');
          const userData = await authService.getCurrentUser();
          console.log('✅ User fetched:', userData);
          setUser(userData);
        } catch (error) {
          console.error('❌ Failed to fetch user:', error);
          authService.clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Logging in...');
      const authResponse = await authService.login(email, password);
      console.log('✅ Login response:', authResponse);
      
      // Store tokens
      authService.setTokens(authResponse.access_token, authResponse.refresh_token);
      console.log('💾 Tokens stored');
      
      // Verify token was stored
      const storedToken = authService.getAccessToken();
      console.log('🔍 Token verification:', {
        tokenLength: storedToken?.length,
        tokenStart: storedToken?.substring(0, 20) + '...'
      });
      
      // Fetch user data
      console.log('📡 Fetching user data after login...');
      const userData = await authService.getCurrentUser();
      console.log('✅ User data fetched:', userData);
      setUser(userData);
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      console.log('📝 Registering user...');
      const userData = await authService.register(data);
      console.log('✅ User registered:', userData);
      
      // Auto-login after registration
      console.log('🔄 Auto-logging in after registration...');
      await login(data.email, data.password);
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    console.log('👋 Logging out...');
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
