import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ArrowDownRight, Activity, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { formatTxDescription } from '../utils/formatTx';
import { motion as Motion } from 'framer-motion';
import Button from '../components/ui/Button';

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

  // Responsive grid logic
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div style={{ paddingTop: '20px' }}>
      <Motion.header 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-h2">Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>Here is your financial snapshot for today.</p>
        </div>
      </Motion.header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <Motion.div 
          className="bento-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Balance Hero Card */}
          <Motion.div 
            variants={itemVariants} 
            className="bento-item"
            style={{ 
              gridColumn: isMobile ? 'span 12' : 'span 8', 
              background: 'var(--card-gradient)',
              color: 'var(--card-text)',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.8, fontWeight: 500 }}>Total Balance</span>
              <CreditCard size={24} color="rgba(255,255,255,0.8)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700, margin: '0 0 32px 0', textShadow: '0 2px 10px rgba(0,0,0,0.3)', position: 'relative', zIndex: 2 }}>
              {formatCurrency(balance)}
            </h2>
            <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
              <button 
                onClick={() => navigate('/transfer')}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <ArrowUpRight size={18} /> Send
              </button>
              <button 
                onClick={() => navigate('/add-money')}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <ArrowDownRight size={18} /> Add
              </button>
            </div>
            
            {/* Holographic glowing orb background */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          </Motion.div>

          {/* Quick Action / Promo Card */}
          <Motion.div 
            variants={itemVariants} 
            className="bento-item"
            style={{ 
              gridColumn: isMobile ? 'span 12' : 'span 4',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
              padding: '32px'
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={32} color="var(--color-green)" />
            </div>
            <div>
              <h3 className="text-h3" style={{ fontSize: '18px', marginBottom: '4px' }}>Account Healthy</h3>
              <p className="text-muted">Your spending is on track.</p>
            </div>
            <Button variant="outline" style={{ width: '100%', marginTop: '8px' }} onClick={() => navigate('/history')}>
              View Insights
            </Button>
          </Motion.div>

          {/* Quick Shortcuts */}
          <Motion.div 
            variants={itemVariants}
            style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}
          >
            {[{ name: 'Pay Bills', icon: <Zap size={24} />, path: '/bills', color: 'var(--color-yellow)' },
              { name: 'Transfer', icon: <ArrowUpRight size={24} />, path: '/transfer', color: 'var(--brand-primary)' },
              { name: 'Add Funds', icon: <ArrowDownRight size={24} />, path: '/add-money', color: 'var(--color-green)' },
              { name: 'Activity', icon: <Activity size={24} />, path: '/history', color: 'var(--brand-secondary)' }
            ].map((shortcut) => (
              <Motion.div
                key={shortcut.name}
                onClick={() => navigate(shortcut.path)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="card"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `color-mix(in srgb, ${shortcut.color} 15%, transparent)`, color: shortcut.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {shortcut.icon}
                </div>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{shortcut.name}</span>
              </Motion.div>
            ))}
          </Motion.div>

          {/* Recent Transactions List */}
          <Motion.div 
            variants={itemVariants} 
            className="bento-item"
            style={{ gridColumn: 'span 12', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="text-h3">Recent Transactions</h3>
              <button onClick={() => navigate('/history')} style={{ background: 'none', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '14px' }}>
                View All
              </button>
            </div>
            
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                No recent transactions yet. Add some money to start!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map((tx, idx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.amount > 0 || tx.type === 'RECEIVE';
                  const displayAmt = Math.abs(tx.amount || 0);

                  return (
                    <Motion.div 
                      key={tx.id || `tx-${idx}`} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(128,128,128,0.05)' }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '16px', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '48px', height: '48px', borderRadius: '14px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(128, 128, 128, 0.08)',
                          color: isCredit ? 'var(--color-green)' : 'var(--text-primary)',
                          border: isCredit ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)'
                        }}>
                          {isCredit ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {formatTxDescription(tx.description || tx.type || 'Transaction', user?.id)}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {(tx.date || tx.createdAt) ? new Date(tx.date || tx.createdAt).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div style={{ 
                        fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '16px', 
                        color: isCredit ? 'var(--color-green)' : 'var(--text-primary)' 
                      }}>
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
    </div>
  );
}
