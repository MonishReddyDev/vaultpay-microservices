import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Check, Landmark, Loader2 } from 'lucide-react';
import styles from './AddMoneyPage.module.css';

const QUICK_AMOUNTS = [50, 100, 250, 500];

export default function AddMoneyPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(val);
    setError('');
  };

  const handleQuickSelect = (val) => {
    setAmount(val.toString());
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await apiClient.post('/wallet/add-money', { 
        amount: parseFloat(amount).toFixed(2), 
        description: 'Account Top-Up' 
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to add funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className={styles.header}>
          <h1 className={styles.title}>Add Money</h1>
          <p className={styles.subtitle}>Top up your wallet balance instantly.</p>
        </header>

        <div className={styles.container}>
          <div className={`card ${styles.card}`}>
            
            {success ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <Check size={48} color="white" />
                </div>
                <h2>Funds Added Successfully!</h2>
                <p>Your balance has been updated with {formatCurrency(parseFloat(amount))}.</p>
                <div className={styles.loaderLine}></div>
                <p className={styles.redirectText}>Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                
                <div className={styles.amountSection}>
                  <label>Enter Amount</label>
                  <div className={styles.amountInputWrapper}>
                    <span className={styles.currencySymbol}>$</span>
                    <input 
                      type="text" 
                      className={styles.amountInput}
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.quickSelectGrid}>
                  {QUICK_AMOUNTS.map(val => (
                    <button 
                      key={val}
                      type="button" 
                      className={`${styles.quickSelectBtn} ${amount === val.toString() ? styles.quickSelectActive : ''}`}
                      onClick={() => handleQuickSelect(val)}
                    >
                      +${val}
                    </button>
                  ))}
                </div>

                <div className={styles.fundingSource}>
                  <label>Funding Source</label>
                  <div className={styles.sourceCardContainer}>
                    <div className={styles.sourceCardActive}>
                      <div className={styles.sourceDetails}>
                         <Landmark size={20} color="var(--brand-primary)" />
                         <div>
                           <p className={styles.sourceName}>Chase Checking</p>
                           <p className={styles.sourceDesc}>**** 9182</p>
                         </div>
                      </div>
                      <div className={styles.checkCircle}></div>
                    </div>
                  </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <button 
                  type="submit" 
                  className={`btn-primary ${styles.submitBtn}`} 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={20} className="spinner" /> : `Add ${amount ? formatCurrency(parseFloat(amount) || 0) : 'Funds'}`}
                </button>

              </form>
            )}
            
          </div>
        </div>
    </>
  );
}
