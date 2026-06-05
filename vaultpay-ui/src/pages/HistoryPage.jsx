import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { formatTxDescription } from '../utils/formatTx';
import { Search, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, IN, OUT
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await apiClient.get('/transactions?limit=50');
      // The API returns { success: true, data: { transactions: [...] } }
      const txData = res.data.data?.transactions || [];
      setTransactions(txData);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    // 1. Filter by IN/OUT
    const isCredit = tx.type === 'DEPOSIT' || tx.type === 'RECEIVE' || parseFloat(tx.amount) > 0;
    if (filter === 'IN' && !isCredit) return false;
    if (filter === 'OUT' && isCredit) return false;

    // 2. Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(searchLower);
      const matchType = tx.type?.toLowerCase().includes(searchLower);
      if (!matchDesc && !matchType) return false;
    }

    return true;
  });

  return (
    <>
      <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Transaction History</h1>
            <p className={styles.subtitle}>Review your complete ledger of incoming and outgoing funds.</p>
          </div>
          <button className="btn-outline">
            <Download size={16} /> Export CSV
          </button>
        </header>

        <div className={`card ${styles.card}`}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search description..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <Filter size={16} className={styles.filterIcon} />
              <button 
                className={`${styles.filterBtn} ${filter === 'ALL' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button 
                className={`${styles.filterBtn} ${filter === 'IN' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('IN')}
              >
                Money In
              </button>
              <button 
                className={`${styles.filterBtn} ${filter === 'OUT' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('OUT')}
              >
                Money Out
              </button>
            </div>
          </div>

          {/* Transaction List Area */}
          <div className={styles.listContainer}>
            {isLoading ? (
              <div className={styles.loaderArea}><div className="spinner"></div></div>
            ) : filteredTransactions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No transactions found.</p>
              </div>
            ) : (
              <div className={styles.txList}>
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'RECEIVE' || parseFloat(tx.amount) > 0;
                  const displayAmt = Math.abs(parseFloat(tx.amount) || 0);

                  return (
                    <div key={tx.id} className={styles.txRow}>
                      <div className={styles.txIconGroup}>
                        <div className={`${styles.txIcon} ${isCredit ? styles.positiveIcon : styles.negativeIcon}`}>
                          {isCredit ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div className={styles.txDetails}>
                          <p className={styles.txTitle}>{formatTxDescription(tx.description || tx.type, user?.id)}</p>
                          <p className={styles.txTypeLabel}>{tx.type}</p>
                        </div>
                      </div>
                      
                      <div className={styles.txSide}>
                        <p className={`${styles.txAmount} ${isCredit ? styles.positiveAmount : ''}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(displayAmt)}
                        </p>
                        <p className={styles.txDate}>
                          {new Date(tx.date || tx.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

    </>
  );
}
