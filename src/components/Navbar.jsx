import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaShoppingCart,
  FaUser,
  FaHeart,
  FaBoxOpen,
  FaChevronDown,
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
  const user = useSelector((state) => state.auth.user);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (user) {
          const response = await axios.get(`${API_BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          dispatch(setCart(response.data));
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".account-dropdown")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shouldHideNavbar =
    pathname.startsWith("/admin") || pathname === "/login" || pathname === "/signup";

  if (shouldHideNavbar) return null;

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

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-md h-20 flex items-center px-6">
      <div className="container mx-auto flex items-center justify-between w-full">
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="AAIA Logo" 
              className="h-12 w-12 rounded-full object-cover" 
            /> 
            <div className="flex items-center">
              <span className="ml-2 text-2xl font-bold text-orange-600 hidden md:inline">AIAA</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-6">
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

          <div className="relative account-dropdown">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center text-gray-700 hover:text-orange-500 focus:outline-none"
            >
              <FaUser className="mr-1" />
              <span className="hidden md:inline">Account</span>
              <FaChevronDown className={`ml-1 text-xs transition-transform ${showDropdown ? "transform rotate-180" : ""}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {user ? (
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-bold truncate">{user.name || "My Account"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || "user@example.com"}</p>
                  </div>
                ) : (
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
                )}

                <Link
                  to={user ? "/account" : "/signin"}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaUser className="mr-3 text-gray-500 text-sm" />
                  My Account
                </Link>

                <Link
                  to={user ? "/orders" : "/signin"}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaBoxOpen className="mr-3 text-gray-500 text-sm" />
                  Orders
                </Link>

                <Link
                  to={user ? "/wishlist" : "/signin"}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaHeart className="mr-3 text-gray-500 text-sm" />
                  Wishlist
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

                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                  >
                    <span className="text-red-500 font-medium">Logout</span>
                  </button>
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