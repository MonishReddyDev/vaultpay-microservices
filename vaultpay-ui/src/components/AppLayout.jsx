import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import ChatAssistant from './ChatAssistant';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="app-container">
      {/* Desktop Top Navigation */}
      <Navbar />

      {/* Main Content Area with Route Transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="page-wrapper"
          >
            {children}
          </Motion.div>
        </AnimatePresence>
      </main>

      {/* Chat Assistant Widget */}
      <ChatAssistant />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
