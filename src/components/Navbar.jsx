import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaChevronDown, FaSignOutAlt } from "react-icons/fa";
import { fetchCurrentUser, logoutUser } from "../services/api";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get cart count from session storage
  const getCartItemCount = () => {
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      const cart = JSON.parse(cartData);
      return cart.items.reduce((total, item) => total + (item.quantity || 1), 0);
    }
    return 0;
  };

  // Check for existing auth state on initial load
  useEffect(() => {
    const checkAuthState = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("userName");

      if (storedToken && storedUser) {
        setIsAuthenticated(true);
      }
    };
    checkAuthState();
  }, []);

  // Fetch user data if authenticated
  useEffect(() => {
    const getUserData = async () => {
      if (isAuthenticated) {
        try {
          const { data, error } = await fetchCurrentUser();
          if (data && !error) {
            setCurrentUser(data.user || data);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };
    getUserData();
  }, [isAuthenticated]);

  // Update cart count when cart changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCartItemCount(getCartItemCount());
    };

    // Listen for changes to session storage
    window.addEventListener('storage', handleStorageChange);
    
    // Initial count
    setCartItemCount(getCartItemCount());

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      
      setIsAuthenticated(false);
      navigate("/signin");
      setShowDropdown(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const shouldHideNavbar = pathname === "/signin" || pathname === "/signup";
  if (shouldHideNavbar) return null;

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-4 sm:px-6">
      <div className="flex items-center justify-end w-full">
        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center p-2 text-gray-700 hover:text-blue-600"
          >
            <FaShoppingCart className="text-lg" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                {cartItemCount}
              </span>
            )}
            <span className="ml-1 hidden sm:inline">Cart</span>
          </Link>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 focus:outline-none p-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {currentUser?.imageUrl ? (
                  <img 
                    src={currentUser.imageUrl} 
                    alt={currentUser.username} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaUser className="text-gray-600" />
                )}
              </div>
              
              {(currentUser || localStorage.getItem("userName")) && (
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {currentUser?.username || localStorage.getItem("userName")}
                </span>
              )}
              
              <FaChevronDown
                className={`text-xs text-gray-500 transition-transform ${
                  showDropdown ? "transform rotate-180" : ""
                } hidden sm:block`}
              />
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="p-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <FaUser className="mr-3 text-gray-500" />
                    My Profile
                  </Link>

                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded mt-2 transition-colors"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/signin"
                        onClick={() => setShowDropdown(false)}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-medium transition-colors"
                      >
                        Sign In
                      </Link>
                      <div className="mt-2 text-center text-sm text-gray-600">
                        New user?{" "}
                        <Link
                          to="/signup"
                          onClick={() => setShowDropdown(false)}
                          className="text-blue-600 hover:underline"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;