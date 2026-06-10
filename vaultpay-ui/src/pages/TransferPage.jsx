import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Send, User, Loader2, CheckCircle2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

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
    <div style={{ paddingTop: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Motion.header 
        style={{ marginBottom: '32px', textAlign: 'center' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-h2">Send Money</h1>
        <p className="text-body" style={{ marginTop: '8px' }}>Instantly transfer funds to another VaultPay user.</p>
      </Motion.header>

      <Card animate={true} style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {success ? (
            <Motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <Motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(0,186,242,0.4)' }}
              >
                <CheckCircle2 size={40} color="white" />
              </Motion.div>
              <h2 className="text-h3" style={{ marginBottom: '8px' }}>Transfer Successful!</h2>
              <p className="text-body" style={{ marginBottom: '32px' }}>You sent {formatCurrency(parseFloat(amount))} safely.</p>
              <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--brand-primary)' }}></div>
              <p className="text-muted" style={{ marginTop: '16px' }}>Returning to dashboard...</p>
            </Motion.div>
          ) : (
            <Motion.form 
              key="form"
              onSubmit={handleSubmit} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                <p className="text-muted" style={{ fontWeight: 500 }}>Available Balance</p>
                <h3 className="text-h3">{formatCurrency(balance)}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="text-muted" style={{ fontWeight: 500 }}>Send To (Phone Number)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    className="input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="Enter recipient's phone number..."
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <label className="text-muted" style={{ display: 'block', marginBottom: '16px', fontWeight: 500 }}>Amount</label>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>$</span>
                  <input 
                    type="text" 
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: amount ? `${amount.length + 1}ch` : '3ch', minWidth: '3ch', textAlign: 'center' }}
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                  />
                </div>
              </div>

              {error && (
                <Motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: 'var(--color-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}
                >
                  {error}
                </Motion.div>
              )}

              <Button type="submit" disabled={isLoading} style={{ marginTop: '8px', padding: '16px' }}>
                {isLoading ? (
                  <Loader2 size={24} className="spinner" />
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>Send {amount ? formatCurrency(parseFloat(amount) || 0) : 'Money'}</span>
                    <Send size={20} />
                  </>
                )}
              </Button>

            </Motion.form>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
