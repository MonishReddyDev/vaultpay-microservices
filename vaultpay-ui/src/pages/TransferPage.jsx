import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Send, User, Loader2, CheckCircle2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import styles from './TransferPage.module.css';

export default function TransferPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/wallet/balance')
      .then(res => {
        const bal = res.data.data?.balance || res.data.balance || 0;
        setBalance(bal);
      })
      .catch(err => console.error("Balance fetch error:", err));
  }, []);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recipientPhone.trim()) {
      setError('Please enter a recipient Phone Number.');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient funds. Please enter a smaller amount or add money.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const lookupRes = await apiClient.get(`/wallet/lookup?phone=${encodeURIComponent(recipientPhone.trim())}`);
      const resolvedUserId = lookupRes.data?.data?.id;
      const resolvedUserName = lookupRes.data?.data?.name;

      if (!resolvedUserId) {
        setError('Recipient not found.');
        setIsLoading(false);
        return;
      }

      await apiClient.post('/wallet/transfer', { 
        toUserId: resolvedUserId,
        toUserName: resolvedUserName,
        fromUserName: user?.name,
        amount: parseFloat(amount).toFixed(2)
      });
      
      setSuccess(true);
      window.dispatchEvent(new CustomEvent('new_notification'));
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Transfer failed. Check recipient ID and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.title}>Send Money</h1>
        <p className={styles.subtitle}>Instantly transfer funds to another VaultPay user.</p>
      </Motion.header>

      <Motion.div 
        className={styles.container}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className={`card ${styles.card}`}>
          <AnimatePresence mode="wait">
            {success ? (
              <Motion.div 
                key="success"
                className={styles.successState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                >
                  <CheckCircle2 size={80} className={styles.successIcon} />
                </Motion.div>
                <h2>Transfer Successful!</h2>
                <p>You sent {formatCurrency(parseFloat(amount))} safely.</p>
                <div className={styles.loaderLine}></div>
                <p className={styles.redirectText}>Returning to dashboard...</p>
              </Motion.div>
            ) : (
              <Motion.form 
                key="form"
                onSubmit={handleSubmit} 
                className={styles.form}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                
                {/* Available Balance Display */}
                <div className={styles.balanceInfo}>
                  <p>Available Balance</p>
                  <h3>{formatCurrency(balance)}</h3>
                </div>

                {/* Recipient Input */}
                <div className={styles.inputGroup}>
                  <label>Send To (Phone Number)</label>
                  <div className={styles.inputWrapper}>
                    <User size={20} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Enter recipient's phone number..."
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount Input */}
                <div className={styles.inputGroup}>
                  <label>Amount</label>
                  <Motion.div 
                    className={styles.amountInputContainer}
                    whileFocus={{ scale: 1.02 }}
                  >
                    <span className={styles.currencySymbol}>$</span>
                    <input 
                      type="text" 
                      className={styles.amountInput}
                      placeholder="0.00"
                      value={amount}
                      onChange={handleAmountChange}
                    />
                  </Motion.div>
                </div>

                {error && (
                  <Motion.div 
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </Motion.div>
                )}

                <Motion.button 
                  type="submit" 
                  className={`btn-primary ${styles.submitBtn}`} 
                  disabled={isLoading}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 size={24} className="spinner" />
                  ) : (
                    <>
                      <span>Send {amount ? formatCurrency(parseFloat(amount) || 0) : 'Money'}</span>
                      <Send size={20} />
                    </>
                  )}
                </Motion.button>

              </Motion.form>
            )}
          </AnimatePresence>
        </div>
      </Motion.div>
    </>
  );
}
