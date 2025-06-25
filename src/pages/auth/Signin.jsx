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
      localStorage.setItem("userRole", roles[0]); // Using the first role
      localStorage.setItem("userName", userName);

      // Redirect based on role
      switch(roles[0].toLowerCase()) {
        case 'admin':
          navigate("/dashboard/admin");
          break;
        case 'manager':
          navigate("/dashboard/manager");
          break;
        case 'user':
          navigate("/dashboard/user");
          break;
        default:
          navigate("/dashboard");
      }

    } catch (err) {
      setIsLoading(false);
      
      // Handle different error cases
      if (err.response) {
        // The request was made and the server responded with a status code
        if (err.response.status === 401) {
          setError("Invalid username or password");
        } else if (err.response.status === 404) {
          setError("User not found");
        } else {
          setError("Login failed. Please try again later.");
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError("Network error. Please check your connection.");
      } else {
        // Something happened in setting up the request
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Image Section */}
        <div className="md:w-1/3 lg:w-2/5 h-64 md:h-auto">
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66"
            alt="Login illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-2/3 lg:w-3/5 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">Sign in to your account</p>

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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;