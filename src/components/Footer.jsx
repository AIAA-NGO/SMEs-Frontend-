
import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-10 mt-20">
      {/* Social Icons */}
      <div className="flex justify-center space-x-6 mb-8">
        <a
          href="https://www.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="hover:text-blue-500"
        >
          <FaFacebookF size={24} />
        </a>
        <a
          href="https://www.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="hover:text-pink-500"
        >
          <FaInstagram size={24} />
        </a>
        <a
          href="https://www.linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="hover:text-blue-700"
        >
          <FaLinkedinIn size={24} />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter)"
          className="hover:text-sky-400"
        >
          <FaTwitter size={24} />
        </a>
      </div>

      {/* Footer content */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
        {/* About Us */}
        <div>
          <h3 className="text-xl font-semibold mb-4">About Us</h3>
          <p className="text-gray-300 leading-relaxed">
            SME Inventory System is dedicated to helping small and medium enterprises
            manage their stock efficiently and grow their businesses with ease.
          </p>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Features</h3>
          <ul className="space-y-2 text-gray-300">
            <li>- Inventory Management</li>
            <li>- Low Stock Alerts</li>
            <li>- Supplier & Category Tracking</li>
            <li>- Export & Reporting Tools</li>
            <li>- User-friendly Interface</li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
          <ul className="text-gray-300 space-y-2">
            <li><strong>Email:</strong> support@smeinvent.com</li>
            <li><strong>Phone:</strong> +254 700 123 456</li>
            <li><strong>Address:</strong> 123 Business Street, Nairobi, Kenya</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-400 mt-8 text-sm">
        &copy; {new Date().getFullYear()} SME Inventory System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
