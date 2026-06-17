import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { formatTxDescription } from '../utils/formatTx';
import { Search, ArrowUpRight, ArrowDownRight, Filter, Download, Activity } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import Card from '../components/ui/Card';

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, IN, OUT
  const [searchTerm, setSearchTerm] = useState('');



  useEffect(() => {
    let isMounted = true;
    apiClient.get('/transactions?limit=50')
      .then(res => { if (isMounted) setTransactions(res.data.data?.transactions || []); })
      .catch(err => console.error("Failed to fetch transactions:", err))
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const isCredit = tx.type === 'DEPOSIT' || tx.type === 'RECEIVE' || parseFloat(tx.amount) > 0;
    if (filter === 'IN' && !isCredit) return false;
    if (filter === 'OUT' && isCredit) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(searchLower);
      const matchType = tx.type?.toLowerCase().includes(searchLower);
      if (!matchDesc && !matchType) return false;
    }

    return true;
  });

  return (
    <div style={{ paddingTop: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-h2">Transaction History</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>Review your complete ledger of incoming and outgoing funds.</p>
        </div>
        <button className="btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600 }}>
          <Download size={16} /> Export
        </button>
      </header>

      <Card style={{ padding: '0' }}>
        {/* Controls Bar */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', flexDirection: 'column', '@media (min-width: 768px)': { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }}>
          
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search description..." 
              className="input"
              style={{ paddingLeft: '44px', background: 'rgba(128,128,128,0.05)', border: '1px solid transparent' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'IN', 'OUT'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{ 
                  padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  background: filter === f ? 'var(--brand-primary)' : 'rgba(128,128,128,0.08)',
                  color: filter === f ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {f === 'ALL' ? 'All' : f === 'IN' ? 'Money In' : 'Money Out'}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List Area */}
        <div style={{ padding: '0 24px' }}>
          {isLoading ? (
            <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
              <p>No transactions found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredTransactions.map((tx, idx) => {
                const isCredit = tx.type === 'DEPOSIT' || tx.type === 'RECEIVE' || parseFloat(tx.amount) > 0;
                const displayAmt = Math.abs(parseFloat(tx.amount) || 0);

                return (
                  <Motion.div 
                    key={tx.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '20px 0', borderBottom: '1px solid var(--border-color)' 
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '14px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(128, 128, 128, 0.05)',
                        color: isCredit ? 'var(--color-green)' : 'var(--text-primary)',
                      }}>
                        {isCredit ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatTxDescription(tx.description || tx.type, user?.id)}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tx.type}</p>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '16px',
                        color: isCredit ? 'var(--color-green)' : 'var(--text-primary)'
                      }}>
                        {isCredit ? '+' : '-'}{formatCurrency(displayAmt)}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(tx.date || tx.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </Motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
