import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // to handle initial load

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function calling mock loginUser
  const login = async ({ email, password }) => {
    try {
      const response = await loginUser({ email, password });
      const loggedInUser = {
        ...response.data.user,
        role: response.data.role,
        token: response.data.token,
      };
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  // Register function calling mock registerUser
  const register = async (data) => {
    try {
      const response = await registerUser(data);
      const registeredUser = {
        ...response.data.user,
        role: response.data.role,
        token: response.data.token,
      };
      setUser(registeredUser);
      localStorage.setItem("user", JSON.stringify(registeredUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
