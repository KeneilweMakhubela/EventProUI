import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// API Base URL
const API_BASE_URL = 'https://localhost:7119';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('eventProUser');
    const storedToken = localStorage.getItem('eventProToken');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setAuthToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('eventProUser');
        localStorage.removeItem('eventProToken');
      }
    }
    setLoading(false);
  }, []);

  // Helper function for API calls - gets token directly from localStorage
  const getToken = () => {
    return authToken || localStorage.getItem('eventProToken');
  };

  // Helper function for API calls
  const apiCall = useCallback(async (endpoint, method = 'GET', body = null) => {
    const token = getToken();
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`🔑 Using token: ${token.substring(0, 20)}...`);
    } else {
      console.warn('⚠️ No auth token available!');
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
      console.log(`📤 ${method} ${endpoint} - Body:`, JSON.stringify(body, null, 2));
    }

    console.log(`🚀 Sending ${method} request to: ${API_BASE_URL}${endpoint}`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // Try to get error details
        let errorData = null;
        let errorMessage = `Request failed with status ${response.status}`;
        
        try {
          errorData = await response.json();
          console.error('❌ API Error Response:', errorData);
          
          // Handle different error formats
          if (errorData.errors) {
            // ASP.NET Core validation errors
            const error = new Error('Validation failed');
            error.errors = errorData.errors;
            error.response = {
              status: response.status,
              data: errorData,
              statusText: response.statusText
            };
            throw error;
          }
          
          errorMessage = errorData?.message || errorData?.title || errorMessage;
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
          } else if (response.status === 404) {
            errorMessage = 'Resource not found.';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        } catch (parseError) {
          console.error('❌ Could not parse error response');
        }
        
        const error = new Error(errorMessage);
        error.response = {
          status: response.status,
          data: errorData || {},
          statusText: response.statusText
        };
        if (errorData?.errors) {
          error.errors = errorData.errors;
        }
        throw error;
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ Response data:`, data);
        return data;
      }
      
      console.log('✅ Request successful (no JSON response)');
      return { success: true };
    } catch (error) {
      console.error('❌ API Call Error:', error);
      throw error;
    }
  }, [authToken]);

  const login = async (email, password, role = 'player') => {
    try {
      console.log('🔐 Attempting login...');
      const response = await apiCall('/api/Auth/login', 'POST', {
        email,
        password,
      });

      console.log('📦 FULL LOGIN RESPONSE:', JSON.stringify(response, null, 2));
      console.log('📦 Response keys:', Object.keys(response));
      
      console.log('📦 userId:', response.userId);
      console.log('📦 id:', response.id);
      console.log('📦 playerId:', response.playerId);

      const userId = response.userId || response.id || response.playerId;
      // Handle successful login response
      const userData = {
        id: userId,
        email: response.email || email,
        name: response.name || response.fullName || 
          (response.firstName 
            ? `${response.firstName || ''} ${response.lastName || ''}`.trim()
            : email.split('@')[0]),
        firstName: response.firstName,
        lastName: response.lastName,
        phone: response.phoneNumber || response.phone,
        role: response.role || role,
        avatar: (response.firstName || email).charAt(0).toUpperCase(),
      };

      const token = response.token || response.accessToken || response.jwt;

      if (!token) {
        console.warn('⚠️ No token received from login response');
      }

      setUser(userData);
      setAuthToken(token);
      setIsAuthenticated(true);
      
      localStorage.setItem('eventProUser', JSON.stringify(userData));
      if (token) {
        localStorage.setItem('eventProToken', token);
      }

      console.log('✅ Login successful, user:', userData);
      return { success: true, user: userData, token };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
        console.log('📝 Attempting registration...');
        const response = await apiCall('/api/Auth/register', 'POST', {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phone,
            password: userData.password,
            role: userData.role || 'player',
        });

        console.log('✅ Registration response:', response);

        const newUser = {
            id: response.id || response.userId || response.playerId,
            email: response.email || userData.email,
            name: response.name || response.fullName || `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: response.phoneNumber || userData.phone,
            role: response.role || userData.role || 'player',
            avatar: userData.firstName.charAt(0).toUpperCase(),
        };

        const token = response.token || response.accessToken || response.jwt;

        setUser(newUser);
        setAuthToken(token);
        setIsAuthenticated(true);
        
        localStorage.setItem('eventProUser', JSON.stringify(newUser));
        if (token) {
            localStorage.setItem('eventProToken', token);
        }

        console.log('✅ Registration successful, user:', newUser);
        return { success: true, user: newUser, token };
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Check if error has validation errors
        if (error.errors) {
            return { 
                success: false, 
                error: error.errors,
                validationErrors: true
            };
        } else if (error.response?.data?.errors) {
            return { 
                success: false, 
                error: error.response.data.errors,
                validationErrors: true
            };
        } else if (error.response?.data?.message) {
            return { 
                success: false, 
                error: error.response.data.message
            };
        } else {
            return { 
                success: false, 
                error: error.message || 'Registration failed. Please try again.' 
            };
        }
    }
};

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('eventProUser');
    localStorage.removeItem('eventProToken');
    console.log('👋 Logged out');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('eventProUser', JSON.stringify(updatedUser));
    console.log('👤 User updated locally:', updatedUser);
  };

  const refreshToken = async () => {
    try {
      const response = await apiCall('/api/Auth/refresh', 'POST');
      if (response.token) {
        setAuthToken(response.token);
        localStorage.setItem('eventProToken', response.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    authToken,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    apiCall,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;