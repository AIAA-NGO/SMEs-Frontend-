import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      // Set axios default headers if token exists
      const { token } = JSON.parse(storedUser);
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async ({ username, password }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
        { username, password }
      );
      
      const loggedInUser = {
        username: response.data.username,
        roles: response.data.roles,
        token: response.data.token,
      };
      
      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      
      // Set axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  // Register function
  const register = async (data) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
        data
      );
      
      const registeredUser = {
        username: response.data.username,
        roles: response.data.roles,
        token: response.data.token,
      };
      
      setUser(registeredUser);
      localStorage.setItem("user", JSON.stringify(registeredUser));
      
      // Set axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Registration failed",
        errors: error.response?.data?.errors 
      };
    }
  };

  // Logout function (removed navigate)
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    return true; // Indicate logout was successful
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/me`
      );
      return response.data;
    } catch (error) {
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register, 
        loading,
        getCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);