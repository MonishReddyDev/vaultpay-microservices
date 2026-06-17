import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { formatCurrency } from '../utils/formatCurrency';
import { Lightbulb, Droplets, Wifi, Smartphone, Flame, Shield, Loader2, CheckCircle2, History, ArrowLeft } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const BILL_CATEGORIES = [
  { code: 'ELEC', name: 'Electricity', icon: Lightbulb, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { code: 'WTR', name: 'Water', icon: Droplets, color: '#00baf2', bg: 'rgba(0, 186, 242, 0.15)' },
  { code: 'INT', name: 'Internet', icon: Wifi, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { code: 'MOB', name: 'Mobile', icon: Smartphone, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  { code: 'GAS', name: 'Gas', icon: Flame, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { code: 'INS', name: 'Insurance', icon: Shield, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
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

  const fetchRecentBills = async () => {
    try {
      const res = await apiClient.get('/bills?limit=5');
      setRecentBills(res.data.data?.records || []);
    } catch (err) {
      console.error("Failed to fetch bill history:", err);
    } finally {
      setIsLoadingBills(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    apiClient.get('/bills?limit=5')
      .then(res => { if (isMounted) setRecentBills(res.data.data?.records || []); })
      .catch(err => console.error("Failed to fetch bill history:", err))
      .finally(() => { if (isMounted) setIsLoadingBills(false); });
    return () => { isMounted = false; };
  }, []);

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
    <div style={{ paddingTop: '20px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 className="text-h2">Utility Bills</h1>
        <p className="text-body" style={{ marginTop: '8px' }}>Pay your essential bills quickly and securely.</p>
      </header>

      <div className="bento-container">
        
        {/* Main Action Area */}
        <div style={{ gridColumn: 'span 12' }} className="bento-item">
          {!selectedBiller ? (
             <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '8px' }}>
               <h2 className="text-h3" style={{ marginBottom: '24px' }}>Select a Category</h2>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                 {BILL_CATEGORIES.map(biller => {
                   const Icon = biller.icon;
                   return (
                     <Motion.button 
                       key={biller.code} 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => handleBillerSelect(biller)}
                       style={{ 
                         background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', 
                         padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                         boxShadow: 'var(--shadow-sm)', transition: 'border 0.2s', color: 'var(--text-primary)'
                       }}
                     >
                       <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: biller.bg, color: biller.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Icon size={28} strokeWidth={2.5} />
                       </div>
                       <span style={{ fontWeight: 600, fontSize: '15px' }}>{biller.name}</span>
                     </Motion.button>
                   );
                 })}
               </div>
             </Motion.div>
          ) : (
             <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '8px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <button onClick={() => setSelectedBiller(null)} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                   <ArrowLeft size={18} /> Back
                 </button>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: selectedBiller.bg, color: selectedBiller.color, borderRadius: '20px', fontWeight: 600, fontSize: '14px' }}>
                   <selectedBiller.icon size={16} /> 
                   {selectedBiller.name}
                 </div>
               </div>

               <AnimatePresence mode="wait">
                 {success ? (
                   <Motion.div 
                     key="success"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                   >
                     <Motion.div
                       initial={{ scale: 0 }}
                       animate={{ scale: 1, rotate: 360 }}
                       style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(0,186,242,0.4)' }}
                     >
                       <CheckCircle2 size={40} color="white" />
                     </Motion.div>
                     <h2 className="text-h3" style={{ marginBottom: '8px' }}>Payment Processing</h2>
                     <p className="text-body">Your {selectedBiller.name} bill payment has been initiated successfully.</p>
                   </Motion.div>
                 ) : (
                   <Motion.form 
                     key="form"
                     onSubmit={handlePayBill} 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}
                   >
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label className="text-muted" style={{ fontWeight: 500 }}>Account / Meter Number</label>
                       <input 
                         type="text" 
                         className="input" 
                         placeholder={`Enter your ${selectedBiller.name.toLowerCase()} account number`}
                         value={accountNumber}
                         onChange={(e) => { setAccountNumber(e.target.value); setError(''); }}
                         autoFocus
                       />
                     </div>
                     
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', marginTop: '16px' }}>
                       <label className="text-muted" style={{ fontWeight: 500 }}>Amount Due</label>
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

                     {error && <div style={{ color: 'var(--color-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{error}</div>}

                     <Button type="submit" disabled={isSubmitting} style={{ padding: '16px', marginTop: '16px' }}>
                       {isSubmitting ? <Loader2 size={24} className="spinner" /> : 'Pay Bill Securely'}
                     </Button>
                   </Motion.form>
                 )}
               </AnimatePresence>
             </Motion.div>
          )}
        </div>

        {/* Recent History Area */}
        <div style={{ gridColumn: 'span 12' }}>
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <History size={20} color="var(--brand-primary)" />
              <h3 className="text-h3" style={{ fontSize: '18px' }}>Recent Payments</h3>
            </div>
            
            {isLoadingBills ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><div className="spinner"></div></div>
            ) : recentBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No recent bills found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentBills.map(bill => (
                  <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(128,128,128,0.02)', borderRadius: '12px' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.billerName}</p>
                      <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{new Date(bill.date || bill.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(parseFloat(bill.amount))}</p>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase',
                        background: bill.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: bill.status === 'COMPLETED' ? 'var(--color-green)' : 'var(--color-yellow)'
                      }}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
