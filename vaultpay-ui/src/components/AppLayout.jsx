import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.appContainer}>
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div className={styles.backdrop} onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={styles.mainWrapper}>
        <Topbar toggleSidebar={toggleSidebar} />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
