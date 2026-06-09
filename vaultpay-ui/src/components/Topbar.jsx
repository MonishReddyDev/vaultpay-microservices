import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Search, Menu } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

export default function Topbar({ toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const handleNotification = () => setNotifications(prev => prev + 1);
    window.addEventListener('new_notification', handleNotification);
    return () => window.removeEventListener('new_notification', handleNotification);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={20} />
          <AnimatePresence>
            {notifications > 0 && (
              <Motion.span 
                className={styles.badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {notifications}
              </Motion.span>
            )}
          </AnimatePresence>
        </button>
        
        <div className={styles.profileBtn} onClick={() => navigate('/profile')}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
