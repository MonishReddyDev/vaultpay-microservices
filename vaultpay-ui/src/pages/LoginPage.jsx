import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, phone);
      }
      navigate('/dashboard'); 
    } catch (err) {
      const message = err.response?.data?.message || 'Authentication failed. Please check credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Left Side: Abstract Graphic / Branding */}
      <div style={{ 
        flex: 1,
        background: 'var(--brand-secondary)', position: 'relative', overflow: 'hidden',
        color: 'white', padding: '64px', flexDirection: 'column', justifyContent: 'space-between'
      }} className="desktop-only">
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '64px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--brand-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} color="white" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>VaultPay</h1>
          </div>
          
          <h2 style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', maxWidth: '600px' }}>
            The future of your finances.
          </h2>
          <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '500px', marginTop: '24px', lineHeight: 1.6 }}>
            Manage, move, and multiply your money with state-of-the-art security and design.
          </p>
        </div>

        {/* Abstract Mesh Background */}
        <div style={{ 
          position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
          background: 'radial-gradient(circle at 80% 20%, rgba(0,186,242,0.6) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(15,74,138,0.8) 0%, transparent 50%)',
          filter: 'blur(80px)', zIndex: 1
        }}></div>
      </div>

      {/* Right Side: Auth Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px', position: 'relative', zIndex: 10, maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', justifyContent: 'center' }} className="mobile-header">
          <div style={{ width: '40px', height: '40px', background: 'var(--brand-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={20} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>VaultPay</h1>
        </div>

        <Motion.div 
          layout
          style={{ background: 'var(--bg-card)', padding: '48px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2 className="text-h2" style={{ marginBottom: '8px' }}>
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-body">
              {isLogin ? 'Enter your details to access your account.' : 'Join VaultPay to start managing your money.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <Motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-red)', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
              >
                {error}
              </Motion.div>
            )}

            <AnimatePresence mode="wait">
              {!isLogin && (
                <Motion.div 
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}
                >
                  <Input 
                    label="Full Name" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required={!isLogin} 
                  />
                  <Input 
                    label="Phone Number" 
                    type="tel" 
                    placeholder="+14155552671" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required={!isLogin} 
                  />
                </Motion.div>
              )}
            </AnimatePresence>

            <Input 
              label="Email Address" 
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="text-muted" style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                {isLogin && <a href="#" style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>Forgot Password?</a>}
              </div>
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button type="submit" disabled={isLoading} style={{ padding: '16px', marginTop: '8px' }}>
              {isLoading ? <Loader2 className="spinner" size={24} /> : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ background: 'none', color: 'var(--brand-primary)', fontWeight: 600 }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </Motion.div>

      </div>
      
      {/* Mobile-only styles via inline injection to handle media query for left-side display */}
      <style>
        {`
          .desktop-only {
            display: flex !important;
          }
          @media (max-width: 1024px) {
            .desktop-only {
              display: none !important;
            }
          }
          @media (min-width: 1025px) {
            .mobile-header {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
