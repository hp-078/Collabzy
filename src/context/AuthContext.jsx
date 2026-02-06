import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import socketService from '../services/socket.service';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token with backend
          const response = await authService.getMe();
          // Backend returns { success: true, user: {...} }
          // So we need to extract the user object
          if (response && response.data && response.data.user) {
            const userData = response.data.user;
            console.log('✅ User data loaded:', userData);
            setUser(userData);

            // Also update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(userData));

            // Connect to Socket.io
            socketService.connect();
          } else {
            console.error('❌ Invalid response format:', response);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('❌ Token validation failed:', error.message);
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      
      // Connect to Socket.io after login
      socketService.connect();
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      
      // Connect to Socket.io after registration
      socketService.connect();
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    socketService.disconnect();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isInfluencer: user?.role === 'influencer',
    isBrand: user?.role === 'brand',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
