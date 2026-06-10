import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Home, PlusCircle, ArrowRightLeft, FileText, Clock } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: <Home size={24} /> },
    { name: 'History', path: '/history', icon: <Clock size={24} /> },
    { name: 'Transfer', path: '/transfer', icon: <ArrowRightLeft size={24} /> },
    { name: 'Bills', path: '/bills', icon: <FileText size={24} /> },
    { name: 'Add', path: '/add-money', icon: <PlusCircle size={24} /> },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon}
                <span className="nav-label">{item.name}</span>
                {isActive && (
                  <Motion.div 
                    layoutId="activeTabMobile" 
                    className="active-indicator"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
