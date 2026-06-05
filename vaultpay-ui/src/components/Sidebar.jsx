import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, Receipt, History, User, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Wallet color="var(--brand-primary)" size={28} strokeWidth={2.5} />
        <span>VaultPay</span>
      </div>

      <nav className={styles.navLinks}>
        <NavLink to="/dashboard" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/transfer" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
          <Send size={20} />
          <span>Transfer</span>
        </NavLink>
        <NavLink to="/bills" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
          <Receipt size={20} />
          <span>Bills</span>
        </NavLink>
        <NavLink to="/history" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
          <History size={20} />
          <span>Transactions</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => isActive ? styles.activeLink : styles.link}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <button className={styles.logoutBtn} onClick={logout}>
        <LogOut size={20} />
        <span>Log Out</span>
      </button>
    </aside>
  );
}
