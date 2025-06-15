import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBoxOpen,
  FaChevronDown,
  FaCog,
  FaLock,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import axios from "axios";
import { setCart } from "../features/cartSlice";
import { logout } from "../features/auth/authSlice";

const API_BASE_URL = "http://localhost:8080/api";

const NavBar = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (user) {
          const response = await axios.get(`${API_BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          dispatch(setCart(response.data));
          
          // Fetch user profile image if available
          if (user.profileImage) {
            setProfileImage(user.profileImage);
          }
        } else {
          const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
          dispatch(setCart({ items: guestCart }));
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };
    
    fetchCart();
  }, [user, dispatch]);

  useEffect(() => {
    const count = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    setCartItemCount(count);
  }, [cartItems]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setShowDropdown(false);
  };

  const shouldHideNavbar =
    pathname.startsWith("/admin") || pathname === "/login" || pathname === "/signup";

  if (shouldHideNavbar) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-md h-20 flex items-center px-6">
      <div className="container mx-auto flex items-center justify-between w-full">
        {/* Logo and left side */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="AAIA Logo" 
              className="h-12 w-12 rounded-full object-cover" 
            /> 
            <span className="ml-2 text-2xl font-bold text-orange-600 hidden md:inline">AIAA</span>
          </Link>
        </div>

        {/* Right side navigation */}
        <div className="flex items-center space-x-6">
          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center text-gray-700 hover:text-orange-500"
          >
            <FaShoppingCart className="mr-1" />
            <span className="hidden md:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-orange-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 focus:outline-none"
            >
              {/* Profile picture or default icon */}
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaUser className="text-gray-600" />
                </div>
              )}
              <FaChevronDown className={`text-xs text-gray-500 transition-transform ${showDropdown ? "transform rotate-180" : ""}`} />
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {user ? (
                  <>
                    {/* Profile header */}
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center space-x-3">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUser className="text-gray-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name || user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <Link
                      to="/account/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaUser className="mr-3 text-gray-500" />
                      My Profile
                    </Link>

                    <Link
                      to="/account/orders"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaBoxOpen className="mr-3 text-gray-500" />
                      My Orders
                    </Link>

                    <Link
                      to="/account/wishlist"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaHeart className="mr-3 text-gray-500" />
                      Wishlist
                    </Link>

                    <Link
                      to="/account/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaCog className="mr-3 text-gray-500" />
                      Account Settings
                    </Link>

                    <Link
                      to="/account/change-password"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaLock className="mr-3 text-gray-500" />
                      Change Password
                    </Link>

                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                      >
                        <span className="text-blue-500 font-medium">Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                    >
                      <FaSignOutAlt className="mr-3 text-red-500" />
                      <span className="text-red-500 font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-2 border-b">
                      <Link
                        to="/signin"
                        onClick={() => setShowDropdown(false)}
                        className="block w-full text-center bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 font-bold"
                      >
                        Sign In
                      </Link>
                      <div className="mt-2 text-center text-sm">
                        New customer?{" "}
                        <Link
                          to="/signup"
                          onClick={() => setShowDropdown(false)}
                          className="text-orange-500 hover:underline"
                        >
                          Sign up
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;