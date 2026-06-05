import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddMoneyPage from './pages/AddMoneyPage';
import TransferPage from './pages/TransferPage';
import BillPaymentPage from './pages/BillPaymentPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

/**
 * Route protection: Only allows access if user is logged in
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="spinner"></div></div>;
  }
  
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
};

/**
 * Public route protection: Redirects to dashboard if already logged in
 * Ensures a logged-in user cannot accidentally open the login page
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="spinner"></div></div>;
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Base route redirects directly to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public Login/Register Page */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected Area */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/add-money" 
            element={
              <PrivateRoute>
                <AddMoneyPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/transfer" 
            element={
              <PrivateRoute>
                <TransferPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/bills" 
            element={
              <PrivateRoute>
                <BillPaymentPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } 
          />
          
          {/* Add future routes here (Transfer, Bills, History, Profile) */}
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
