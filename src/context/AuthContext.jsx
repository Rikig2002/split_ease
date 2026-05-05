import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { clearPendingInviteToken } from "../utils/pendingInvite";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const authToken = response.data.token;
    const loggedInUser = { ...response.data };

    delete loggedInUser.token;

    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(loggedInUser);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    clearPendingInviteToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
