import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Check, Landmark, Loader2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to add funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="text-h2">Add Money</h1>
        <p className="text-body" style={{ marginTop: '8px' }}>Top up your wallet balance instantly.</p>
      </header>

      <Card style={{ overflow: 'hidden' }}>
        {success ? (
          <Motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
              <Check size={40} color="white" />
            </div>
            <h2 className="text-h3" style={{ marginBottom: '8px' }}>Funds Added Successfully!</h2>
            <p className="text-body" style={{ marginBottom: '32px' }}>Your balance has been updated with {formatCurrency(parseFloat(amount))}.</p>
            <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--color-green)' }}></div>
            <p className="text-muted" style={{ marginTop: '16px' }}>Redirecting to dashboard...</p>
          </Motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ textAlign: 'center' }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '16px', fontWeight: 500 }}>Enter Amount</label>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>$</span>
                <input 
                  type="text" 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: amount ? `${amount.length + 1}ch` : '3ch', minWidth: '3ch', textAlign: 'center' }}
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {QUICK_AMOUNTS.map(val => (
                <button 
                  key={val}
                  type="button" 
                  style={{ 
                    padding: '12px 0', 
                    borderRadius: '12px', 
                    border: amount === val.toString() ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)', 
                    background: amount === val.toString() ? 'rgba(0,186,242,0.1)' : 'transparent',
                    color: amount === val.toString() ? 'var(--brand-primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => { setAmount(val.toString()); setError(''); }}
                >
                  +${val}
                </button>
              ))}
            </div>

            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>Funding Source</label>
              <div style={{ padding: '16px', borderRadius: '16px', border: '2px solid var(--brand-primary)', background: 'rgba(0,186,242,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    <Landmark size={20} color="var(--brand-primary)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Chase Checking</p>
                    <p className="text-muted" style={{ fontSize: '13px' }}>**** 9182</p>
                  </div>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} color="white" />
                </div>
              </div>
            </div>

            {error && <div style={{ color: 'var(--color-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{error}</div>}

            <Button type="submit" disabled={isLoading} style={{ marginTop: '8px', padding: '16px' }}>
              {isLoading ? <Loader2 size={24} className="spinner" /> : `Add ${amount ? formatCurrency(parseFloat(amount) || 0) : 'Funds'}`}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
