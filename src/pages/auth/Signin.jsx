import React, { useState } from "react";
import { loginUser } from "../../services/api";
import { useNavigate } from "react-router-dom";

const Signin = () => {
  const [username, setUsername] = useState("");  
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password");
        setIsLoading(false);
        return;
      }

      const response = await loginUser({ username, password });
      
      if (!response.data) {
        setError("Invalid server response");
        setIsLoading(false);
        return;
      }

      const { token, roles, username: userName } = response.data;
      
      if (!token) {
        setError("Authentication failed. No token received.");
        setIsLoading(false);
        return;
      }

      if (!roles || roles.length === 0) {
        setError("Your account has no assigned roles. Please contact administrator.");
        setIsLoading(false);
        return;
      }

      // Save info in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", roles[0]);
      localStorage.setItem("userName", userName);

      // Redirect to single dashboard route
      navigate("/dashboard/admin");

    } catch (err) {
      setIsLoading(false);
      
      // Handle different error cases
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid username or password");
        } else if (err.response.status === 404) {
          setError("User not found");
        } else {
          setError("Login failed. Please try again later.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      
      // Clear password field for security
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Image Section */}
        <div className="md:w-1/2 lg:w-2/5 h-full hidden md:block">
          <img
            src="./basket.jpg"
            alt="Login illustration"
            className="w-full h-full object-cover"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 lg:w-3/5 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
              <p className="text-gray-600 mb-8">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600'} text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;