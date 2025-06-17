import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu } from "lucide-react";

const DashboardLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarLinkClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const toggleSidebarMinimize = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className={`fixed top-4 left-4 z-50 p-2 bg-white rounded shadow-md md:hidden ${
          isMobileSidebarOpen ? 'hidden' : ''
        }`}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-6 h-6 text-cyan-600" />
      </button>

      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        isMinimized={isSidebarMinimized}
        onLinkClick={handleSidebarLinkClick}
        onToggleMinimize={toggleSidebarMinimize}
      />

      {/* Backdrop - Only visible on mobile when sidebar is open */}
      {isMobileSidebarOpen && isMobile && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isSidebarMinimized ? "md:ml-20" : "md:ml-64"
      }`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 bg-gray-100 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;