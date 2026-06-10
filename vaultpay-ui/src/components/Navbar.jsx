import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Home, PlusCircle, ArrowRightLeft, FileText, Clock, User, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Transfer', path: '/transfer', icon: <ArrowRightLeft size={18} /> },
    { name: 'Add Money', path: '/add-money', icon: <PlusCircle size={18} /> },
    { name: 'Bills', path: '/bills', icon: <FileText size={18} /> },
    { name: 'History', path: '/history', icon: <Clock size={18} /> },
  ];

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        {/* Brand/Logo */}
        <div className="navbar-brand">
          <div className="logo-icon">V</div>
          <span className="logo-text">VaultPay</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon}
                  <span>{item.name}</span>
                  {isActive && (
                    <Motion.div 
                      layoutId="activeTabDesktop" 
                      className="nav-link-indicator"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="navbar-actions">
          <button className="icon-btn theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="user-menu">
            <NavLink to="/profile" className="user-profile-btn">
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
              <span className="user-name desktop-only">{user?.name || 'User'}</span>
            </NavLink>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
