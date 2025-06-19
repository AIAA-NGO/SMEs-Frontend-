import React, { useState } from "react";
import { registerUser } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field-specific errors when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    setFieldErrors({});

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      await registerUser({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle 400 errors - common patterns in API responses
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        // Check for common backend validation messages
        if (typeof errorData === 'object' && errorData !== null) {
          // Handle field-specific errors
          const newFieldErrors = {};
          Object.keys(errorData).forEach(key => {
            if (key in formData) {
              newFieldErrors[key] = errorData[key];
            }
          });
          
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
          } else {
            // Handle generic object responses
            setError(errorData.message || "Validation failed. Please check your inputs.");
          }
        } 
        // Handle string responses
        else if (typeof errorData === 'string') {
          // Try to detect common patterns
          if (errorData.toLowerCase().includes("username")) {
            setFieldErrors({ username: "Username is already taken" });
          } else if (errorData.toLowerCase().includes("email")) {
            setFieldErrors({ email: "Email is already registered" });
          } else {
            setError(errorData);
          }
        } 
        // Fallback for other 400 errors
        else {
          setError("Invalid registration data. Please check your inputs.");
        }
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Image Section */}
        <div className="md:w-1/3 lg:w-2/5 h-64 md:h-auto">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="Signup illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-2/3 lg:w-3/5 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create your account</h2>
            <p className="text-gray-600 mb-8">Join us today</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border ${fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Error and Success messages */}
              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-500 text-sm p-2 bg-green-50 rounded">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition mt-4 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;