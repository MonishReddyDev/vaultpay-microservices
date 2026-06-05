import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Lightbulb, Droplets, Wifi, Smartphone, Flame, Shield, Loader2, CheckCircle2, History } from 'lucide-react';
import styles from './BillPaymentPage.module.css';

const BILL_CATEGORIES = [
  { code: 'ELEC', name: 'Electricity', icon: Lightbulb, color: '#f59e0b', bg: '#fef3c7' },
  { code: 'WTR', name: 'Water', icon: Droplets, color: '#3b82f6', bg: '#dbeafe' },
  { code: 'INT', name: 'Internet', icon: Wifi, color: '#10b981', bg: '#d1fae5' },
  { code: 'MOB', name: 'Mobile', icon: Smartphone, color: '#6366f1', bg: '#e0e7ff' },
  { code: 'GAS', name: 'Gas', icon: Flame, color: '#ef4444', bg: '#fee2e2' },
  { code: 'INS', name: 'Insurance', icon: Shield, color: '#8b5cf6', bg: '#ede9fe' },
];

export default function BillPaymentPage() {
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [recentBills, setRecentBills] = useState([]);
  const [isLoadingBills, setIsLoadingBills] = useState(true);

  // Fetch recent bill history
  useEffect(() => {
    fetchRecentBills();
  }, []);

  const fetchRecentBills = async () => {
    try {
      const res = await apiClient.get('/bills?limit=5');
      // The backend returns success: true, data: { records: [...] }
      setRecentBills(res.data.data?.records || []);
    } catch (err) {
      console.error("Failed to fetch bill history:", err);
    } finally {
      setIsLoadingBills(false);
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(val);
    setError('');
  };

  const handleBillerSelect = (biller) => {
    setSelectedBiller(biller);
    setSuccess(false);
    setError('');
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    if (!selectedBiller) return;
    if (!accountNumber) {
      setError('Please enter your account or meter number.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/bills/pay', {
        billerCode: selectedBiller.code,
        billerName: selectedBiller.name,
        accountNumber: accountNumber,
        amount: parseFloat(amount).toFixed(2),
        description: `${selectedBiller.name} Bill Payment`
      });

      setSuccess(true);
      setAccountNumber('');
      setAmount('');
      
      // Refresh the bill history
      setTimeout(() => {
        fetchRecentBills();
        setSuccess(false);
        setSelectedBiller(null);
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Bill payment failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Utility Bills</h1>
        <p className={styles.subtitle}>Pay your essential bills quickly and securely.</p>
      </header>

      <div className={styles.grid}>
        {/* Main Action Area */}
        <div className={styles.mainCol}>
          
          {!selectedBiller ? (
             // Category Selection Step
             <div className={`card ${styles.card}`}>
               <h2 className={styles.sectionTitle}>Select a Category</h2>
               <div className={styles.billerGrid}>
                 {BILL_CATEGORIES.map(biller => {
                   const Icon = biller.icon;
                   return (
                     <button 
                       key={biller.code} 
                       className={styles.billerCard}
                       onClick={() => handleBillerSelect(biller)}
                     >
                       <div className={styles.iconCircle} style={{ backgroundColor: biller.bg, color: biller.color }}>
                         <Icon size={24} strokeWidth={2.5} />
                       </div>
                       <span>{biller.name}</span>
                     </button>
                   );
                 })}
               </div>
             </div>
          ) : (
             // Payment Form Step
             <div className={`card ${styles.card}`}>
               <div className={styles.formHeader}>
                 <button className={styles.backBtn} onClick={() => setSelectedBiller(null)}>← Back</button>
                 <div className={styles.selectedBillerBadge}>
                   <selectedBiller.icon size={16} /> 
                   {selectedBiller.name}
                 </div>
               </div>

               {success ? (
                 <div className={styles.successState}>
                   <CheckCircle2 size={64} className={styles.successIcon} />
                   <h2>Payment Processing</h2>
                   <p>Your {selectedBiller.name} bill payment has been initiated successfully.</p>
                 </div>
               ) : (
                 <form onSubmit={handlePayBill} className={styles.paymentForm}>
                   <div className={styles.inputGroup}>
                     <label>Account / Meter Number</label>
                     <input 
                       type="text" 
                       className="input" 
                       placeholder={`Enter your ${selectedBiller.name.toLowerCase()} account number`}
                       value={accountNumber}
                       onChange={(e) => {
                         setAccountNumber(e.target.value);
                         setError('');
                       }}
                       autoFocus
                     />
                   </div>
                   <div className={styles.inputGroup}>
                     <label>Amount Due</label>
                     <div className={styles.amountInputContainer}>
                       <span className={styles.currencySymbol}>$</span>
                       <input 
                         type="text" 
                         className={styles.amountInput}
                         placeholder="0.00"
                         value={amount}
                         onChange={handleAmountChange}
                       />
                     </div>
                   </div>

                   {error && <div className={styles.errorMessage}>{error}</div>}

                   <button 
                     type="submit" 
                     className={`btn-primary ${styles.submitBtn}`}
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? <Loader2 size={20} className="spinner" /> : 'Pay Bill Securely'}
                   </button>
                 </form>
               )}
             </div>
          )}
        </div>

        {/* Sidebar / Recent History Area */}
        <div className={styles.sideCol}>
          <div className={`card ${styles.historyCard}`}>
            <div className={styles.historyHeader}>
              <History size={18} />
              <h3>Recent Payments</h3>
            </div>
            
            {isLoadingBills ? (
              <div className={styles.loaderArea}><div className="spinner"></div></div>
            ) : recentBills.length === 0 ? (
              <div className={styles.emptyState}>No recent bills found.</div>
            ) : (
              <div className={styles.historyList}>
                {recentBills.map(bill => (
                  <div key={bill.id} className={styles.historyRow}>
                    <div className={styles.historyDetails}>
                      <p className={styles.historyName}>{bill.billerName}</p>
                      <p className={styles.historyDate}>{new Date(bill.date || bill.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.historyValues}>
                      <p className={styles.historyAmount}>{formatCurrency(parseFloat(bill.amount))}</p>
                      <span className={`${styles.statusBadge} ${bill.status === 'COMPLETED' ? styles.statusCompleted : bill.status === 'PENDING' ? styles.statusPending : styles.statusFailed}`}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
