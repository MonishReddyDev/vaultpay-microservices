import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { formatTxDescription } from '../utils/formatTx';
import { motion as Motion } from 'framer-motion';
import styles from './DashboardPage.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balanceRes, txRes] = await Promise.all([
          apiClient.get('/wallet/balance'),
          apiClient.get('/transactions') 
        ]);
        
        setBalance(balanceRes.data.data?.balance || balanceRes.data.balance || 0);
        
        const txList = txRes.data.data?.transactions || [];
        setTransactions(txList.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <>
      {/* Main Dashboard Content Area */}
        
        <Motion.header 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className={styles.greeting}>Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
            <p className={styles.subtitle}>Here is your financial snapshot for today.</p>
          </div>
          <div className={styles.avatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
        </Motion.header>

        {loading ? (
          <div className={styles.loader}><div className="spinner"></div></div>
        ) : (
          <Motion.div 
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Balance Card */}
            <Motion.div variants={itemVariants} className={`card ${styles.balanceCard}`}>
              <div className={styles.balanceHeader}>
                <span className={styles.balanceLabel}>Total Balance</span>
                <CreditCard size={24} color="rgba(255,255,255,0.8)" />
              </div>
              <h2 className={styles.balanceAmount}>{formatCurrency(balance)}</h2>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={() => navigate('/transfer')}>
                  <ArrowUpRight size={18} /> Send
                </button>
                <button className={styles.actionBtn} onClick={() => navigate('/add-money')}>
                  <ArrowDownRight size={18} /> Add Money
                </button>
              </div>
              {/* Holographic reflection element */}
              <div className={styles.holoReflection}></div>
            </Motion.div>

            {/* Quick Status Promo Card */}
            <Motion.div variants={itemVariants} className={`card ${styles.promoCard}`}>
               <Activity size={32} color="var(--color-green)" />
               <h3>Account Healthy</h3>
               <p>Your wallet limits are good.</p>
            </Motion.div>

            {/* Recent Transactions List */}
            <Motion.div variants={itemVariants} className={`card ${styles.txCard}`}>
              <div className={styles.txHeader}>
                <h3>Recent Transactions</h3>
                <button className={styles.viewAll} onClick={() => navigate('/history')}>View All</button>
              </div>
              
              {transactions.length === 0 ? (
                <div className={styles.emptyState}>No recent transactions yet. Add some money to start!</div>
              ) : (
                <div className={styles.txList}>
                  {transactions.map((tx, idx) => {
                    const isCredit = tx.type === 'DEPOSIT' || tx.amount > 0 || tx.type === 'RECEIVE';
                    const displayAmt = Math.abs(tx.amount || 0);

                    return (
                      <Motion.div 
                        key={tx.id || Math.random()} 
                        className={styles.txRow}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                      >
                        <div className={styles.txIconGroup}>
                          <div className={`${styles.txIcon} ${isCredit ? styles.positiveIcon : styles.negativeIcon}`}>
                            {isCredit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div className={styles.txDetails}>
                            <p className={styles.txTitle}>{formatTxDescription(tx.description || tx.type || 'Transaction', user?.id)}</p>
                            <p className={styles.txDate}>
                              {(tx.date || tx.createdAt) ? new Date(tx.date || tx.createdAt).toLocaleDateString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <div className={`${styles.txAmount} ${isCredit ? styles.positiveAmount : ''}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(displayAmt)}
                        </div>
                      </Motion.div>
                    );
                  })}
                </div>
              )}
            </Motion.div>

          </Motion.div>
        )}
    </>
  );
}
