import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in when the app first loads
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Fetch current user profile to verify the token is still valid
          const response = await apiClient.get('/auth/profile');
          setUser(response.data.data);
        } catch (error) {
          console.error("Token is invalid or expired", error);
          // eslint-disable-next-line react-hooks/immutability
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    if (email === 'demo@vaultpay.co') {
      localStorage.setItem('is_demo_mode', 'true');
    } else {
      localStorage.removeItem('is_demo_mode');
    }

    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;
    
    // Save token to localStorage for the prototype
    localStorage.setItem('access_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone) => {
    const response = await apiClient.post('/auth/register', { name, email, password, phone });
    const { token, user: userData } = response.data.data;
    
    // Save token to localStorage for the prototype
    localStorage.setItem('access_token', token);
    setUser(userData);
    return userData;
  };

  const startDemoMode = () => {
    localStorage.setItem('is_demo_mode', 'true');
    localStorage.setItem('access_token', 'mock-jwt-token-demo');
    const demoUser = {
      id: 'demo-user-id',
      name: 'Demo CEO',
      email: 'demo@vaultpay.co',
      phone: '+14155552671',
      kycVerified: true,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_demo_mode');
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_balance');
    localStorage.removeItem('demo_transactions');
    localStorage.removeItem('demo_bills');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, startDemoMode }}>
      {/* Do not render the app until we know the authentication status */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
