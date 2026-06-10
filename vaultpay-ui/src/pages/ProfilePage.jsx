import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, LogOut, Key, Bell, CreditCard, X, Loader2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

export default function ProfilePage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/profile');
        setProfileData(res.data.data || res.data.user);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) return;
    setPasswordLoading(true);
    setPasswordMessage({ text: '', type: '' });
    try {
      await apiClient.put('/auth/password', passwordForm);
      setPasswordMessage({ text: 'Password changed successfully.', type: 'success' });
      setPasswordForm({ oldPassword: '', newPassword: '' });
      setTimeout(() => setPasswordModalOpen(false), 2000);
    } catch (err) {
      setPasswordMessage({ 
        text: err.response?.data?.message || 'Failed to change password.', 
        type: 'error' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayUser = profileData || user || {};

  return (
    <div style={{ paddingTop: '20px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 className="text-h2">Account Overview</h1>
        <p className="text-body" style={{ marginTop: '8px' }}>Manage your profile and security settings.</p>
      </header>

      <div className="bento-container">
        
        {/* Main User Identity Box */}
        <div style={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } }} className="bento-item">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px' }}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{ 
                width: '96px', height: '96px', borderRadius: '50%', background: 'var(--brand-secondary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700, color: 'white', border: '4px solid var(--bg-card)',
                boxShadow: '0 8px 24px rgba(15,74,138,0.2)'
              }}>
                {getInitials(displayUser.email)}
              </div>
              {displayUser.isVerified !== false && (
                <div style={{ 
                  position: 'absolute', bottom: '0', right: '0', width: '28px', height: '28px', 
                  borderRadius: '50%', background: 'var(--color-green)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-card)' 
                }} title="Verified Account">
                  <ShieldCheck size={16} color="white" />
                </div>
              )}
            </div>
            
            <h2 className="text-h3" style={{ marginBottom: '4px' }}>
              {displayUser.name || displayUser.email?.split('@')[0] || 'VaultPay User'}
            </h2>
            <p style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '14px', marginBottom: '32px' }}>Personal Account</p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                <Mail size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{displayUser.email || 'No email provided'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                <Phone size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{displayUser.phone || 'No phone provided'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(128,128,128,0.05)', borderRadius: '12px' }}>
                <User size={18} color="var(--text-muted)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)' }}>ID: ••••{displayUser.id?.slice(-4) || '....'}</span>
              </div>
            </div>

            <Button variant="outline" style={{ width: '100%', color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={handleLogout}>
              <LogOut size={18} /> Sign Out
            </Button>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div style={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 8' } }} className="bento-item">
          <h3 className="text-h3" style={{ marginBottom: '24px' }}>Security & Preferences</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '16px', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,186,242,0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Change Password</h4>
                  <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Update your login credentials securely.</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => { setPasswordMessage({text:'', type:''}); setPasswordModalOpen(true); }}>Edit</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Payment Methods</h4>
                  <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Manage cards and bank accounts.</p>
                </div>
              </div>
              <Button variant="outline">Manage</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Notifications</h4>
                  <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>Toggle email and SMS alerts.</p>
                </div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>

          </div>
          
          <div style={{ marginTop: 'auto', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
             <p>Joined {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Today'}</p>
             <p>VaultPay UI v2.0.0</p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <Motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setPasswordModalOpen(false)}
            />
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', position: 'relative', zIndex: 101, boxShadow: 'var(--shadow-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="text-h3">Change Password</h3>
                <button onClick={() => setPasswordModalOpen(false)} style={{ background: 'none', color: 'var(--text-muted)' }}>
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {passwordMessage.text && (
                  <div style={{ padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textAlign: 'center',
                    background: passwordMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: passwordMessage.type === 'error' ? 'var(--color-red)' : 'var(--color-green)'
                  }}>
                    {passwordMessage.text}
                  </div>
                )}
                <Input 
                  label="Current Password"
                  type="password" 
                  required
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                />
                <Input 
                  label="New Password"
                  type="password" 
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />
                <Button type="submit" disabled={passwordLoading} style={{ marginTop: '8px' }}>
                  {passwordLoading ? <Loader2 className="spinner" size={20} /> : 'Update Password'}
                </Button>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
