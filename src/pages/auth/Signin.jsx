import React, { useState } from "react";
import { loginUser } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

const Signin = () => {
  const [username, setUsername] = useState("");  
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginUser({ username, password });
      const token = response.data.token;
      const roles = response.data.roles; // roles is an array like ["ROLE_ADMIN"]
      const userRole = roles && roles.length > 0 ? roles[0] : null;
      const userName = response.data.username;

      if (token && userRole && userName) {
        // Save info in localStorage for auth and personalization
        localStorage.setItem("token", token);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userName", userName);

        // Navigate based on role
        if (userRole === "ADMIN") {
          navigate("/dashboard/admin");
        } else if (userRole === "MANAGER") {
          navigate("/dashboard/manager");
        } else if (userRole === "CASHIER") {
          navigate("/dashboard/cashier");
        } else {
          navigate("/home");
        }
        
      } else {
        setError("Invalid login response");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
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
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
