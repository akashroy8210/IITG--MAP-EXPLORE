import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => authService.getCurrentAdmin());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(false);

  // Keep state in sync with localStorage if changed
  useEffect(() => {
    const handleStorage = () => {
      setAdmin(authService.getCurrentAdmin());
      setToken(authService.getToken());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.adminLogin(email, password);
      if (data && data.token) {
        setAdmin(data.admin);
        setToken(data.token);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    authService.logout();
    setAdmin(null);
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
