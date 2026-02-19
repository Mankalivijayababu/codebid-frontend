import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page refresh
  useEffect(() => {
    const token    = localStorage.getItem("cb_token");
    const userData = localStorage.getItem("cb_user");
    if (token && userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      connectSocket(token);
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem("cb_token", token);
    localStorage.setItem("cb_user", JSON.stringify(userData));
    setUser(userData);
    connectSocket(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cb_token");
    localStorage.removeItem("cb_user");
    setUser(null);
    disconnectSocket();
  }, []);

  // Update user data (e.g. coins change)
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("cb_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
