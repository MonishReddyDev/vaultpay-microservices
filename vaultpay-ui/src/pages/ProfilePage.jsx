import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, LogOut, Key, Bell, CreditCard, X, Loader2 } from 'lucide-react';
import styles from './ProfilePage.module.css';

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
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Account Overview</h1>
        <p className={styles.subtitle}>Manage your profile and security settings.</p>
      </header>

      <div className={styles.grid}>
        {/* Main User Identity Box */}
        <div className={styles.identityCol}>
          <div className={`card ${styles.identityCard}`}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {getInitials(displayUser.email)}
              </div>
              {displayUser.isVerified !== false && (
                <div className={styles.verifiedBadge} title="Verified Account">
                  <ShieldCheck size={16} color="white" />
                </div>
              )}
            </div>
            
            <h2 className={styles.userName}>
              {displayUser.name || displayUser.email?.split('@')[0] || 'VaultPay User'}
            </h2>
            <p className={styles.userRole}>Personal Account</p>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <Mail size={16} className={styles.infoIcon} />
                <span>{displayUser.email || 'No email provided'}</span>
              </div>
              <div className={styles.infoRow}>
                <Phone size={16} className={styles.infoIcon} />
                <span>{displayUser.phone || 'No phone provided'}</span>
              </div>
              <div className={styles.infoRow}>
                <User size={16} className={styles.infoIcon} />
                <span className={styles.uuidText}>ID: ••••{displayUser.id?.slice(-4) || '....'}</span>
              </div>
            </div>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div className={styles.settingsCol}>
          <div className={`card ${styles.settingsCard}`}>
            <h3 className={styles.sectionTitle}>Security & Preferences</h3>
            
            <div className={styles.settingsGrid}>
              
              <div className={styles.settingItem}>
                <div className={styles.settingIconWrap} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-blue)' }}>
                  <Key size={20} />
                </div>
                <div className={styles.settingText}>
                  <h4>Change Password</h4>
                  <p>Update your login credentials securely.</p>
                </div>
                <button className="btn-outline" onClick={() => {
                  setPasswordMessage({text:'', type:''});
                  setPasswordModalOpen(true);
                }}>Edit</button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingIconWrap} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)' }}>
                  <CreditCard size={20} />
                </div>
                <div className={styles.settingText}>
                  <h4>Payment Methods</h4>
                  <p>Manage cards and bank accounts.</p>
                </div>
                <button className="btn-outline">Manage</button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingIconWrap} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-green)' }}>
                  <Bell size={20} />
                </div>
                <div className={styles.settingText}>
                  <h4>Notifications</h4>
                  <p>Toggle email and SMS alerts.</p>
                </div>
                <button className="btn-outline">Configure</button>
              </div>

            </div>
          </div>
          
          <div className={styles.footerWrap}>
             <p>Joined {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Today'}</p>
             <p>Digital Wallet v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`card ${styles.modalCard}`}>
            <div className={styles.modalHeader}>
              <h3>Change Password</h3>
              <button className={styles.closeBtn} onClick={() => setPasswordModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              {passwordMessage.text && (
                <div className={passwordMessage.type === 'error' ? styles.errorMessage : styles.successMessage}>
                  {passwordMessage.text}
                </div>
              )}
              <div className={styles.inputGroup}>
                <label>Current Password</label>
                <input 
                  type="password" 
                  className="input" 
                  required
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>New Password</label>
                <input 
                  type="password" 
                  className="input" 
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={passwordLoading}>
                {passwordLoading ? <Loader2 className="spinner" size={18} /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
