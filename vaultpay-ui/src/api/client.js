import axios from 'axios';

// Create an Axios instance pointing to the API Gateway
const API_URL = import.meta.env.VITE_API_URL || 'https://3-131-133-163.nip.io/api';

const apiClient = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Initialize localStorage-based Mock Database if not present
function initializeDemoDB() {
  if (!localStorage.getItem('demo_balance')) {
    localStorage.setItem('demo_balance', '5240.50');
  }
  if (!localStorage.getItem('demo_transactions')) {
    const initialTxs = [
      {
        id: 'tx-1',
        type: 'DEPOSIT',
        amount: 250.00,
        description: 'Initial Top-up',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'tx-2',
        type: 'SEND',
        amount: -45.00,
        description: 'Send to Monish Dev (+14155559999)',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'tx-3',
        type: 'BILL_PAY',
        amount: -89.99,
        description: 'Electricity Bill Payment',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('demo_transactions', JSON.stringify(initialTxs));
  }
  if (!localStorage.getItem('demo_bills')) {
    const initialBills = [
      {
        id: 'bill-1',
        billerCode: 'ELEC',
        billerName: 'Electricity',
        accountNumber: 'ELE-98218-A',
        amount: '89.99',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem('demo_bills', JSON.stringify(initialBills));
  }
  if (!localStorage.getItem('demo_user')) {
    const defaultUser = {
      id: 'demo-user-id',
      name: 'Demo CEO',
      email: 'demo@vaultpay.co',
      phone: '+14155552671',
      kycVerified: true,
      createdAt: '2026-07-17T12:00:00Z'
    };
    localStorage.setItem('demo_user', JSON.stringify(defaultUser));
  }
}

// Simulated API Handler
const handleMockRequest = async (config) => {
  initializeDemoDB();
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  // Simulate network latency (400ms) for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 400));

  let responseData = { success: true };

  if (url.includes('/auth/login')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const email = body.email || 'demo@vaultpay.co';
    const userObj = {
      id: 'demo-user-id',
      name: email === 'demo@vaultpay.co' ? 'Demo CEO' : email.split('@')[0],
      email: email,
      phone: '+14155552671',
      kycVerified: true,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('demo_user', JSON.stringify(userObj));
    responseData = {
      success: true,
      data: {
        token: 'mock-jwt-token-demo',
        user: userObj
      }
    };
  } else if (url.includes('/auth/register')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const userObj = {
      id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
      name: body.name || 'Demo User',
      email: body.email || 'demo@vaultpay.co',
      phone: body.phone || '+14155552671',
      kycVerified: true,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('demo_user', JSON.stringify(userObj));
    responseData = {
      success: true,
      data: {
        token: 'mock-jwt-token-demo',
        user: userObj
      }
    };
  } else if (url.includes('/auth/profile')) {
    const userObj = JSON.parse(localStorage.getItem('demo_user') || '{}');
    responseData = {
      success: true,
      data: userObj
    };
  } else if (url.includes('/auth/password')) {
    responseData = {
      success: true,
      message: 'Password changed successfully.'
    };
  } else if (url.includes('/wallet/balance')) {
    const balance = parseFloat(localStorage.getItem('demo_balance') || '5240.50');
    responseData = {
      success: true,
      data: {
        balance: balance
      }
    };
  } else if (url.includes('/wallet/add-money')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const amt = parseFloat(body.amount) || 0;
    const currentBal = parseFloat(localStorage.getItem('demo_balance') || '5240.50');
    const newBal = currentBal + amt;
    localStorage.setItem('demo_balance', newBal.toFixed(2));

    const txs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
    const newTx = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      type: 'DEPOSIT',
      amount: amt,
      description: body.description || 'Account Top-Up',
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    localStorage.setItem('demo_transactions', JSON.stringify(txs));

    responseData = { success: true, data: { balance: newBal } };
  } else if (url.includes('/wallet/lookup')) {
    // Extract phone parameter
    let phone = '';
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const params = new URLSearchParams(url.substring(queryIndex));
      phone = params.get('phone') || '';
    } else if (config.params) {
      phone = config.params.phone || '';
    }
    
    responseData = {
      success: true,
      data: {
        id: 'mock-recipient-' + Math.random().toString(36).substring(2, 9),
        name: phone === '+14155559999' ? 'Monish Dev' : 'Company Reviewer',
        phone: phone || '+14155550000'
      }
    };
  } else if (url.includes('/wallet/transfer')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const amt = parseFloat(body.amount) || 0;
    const currentBal = parseFloat(localStorage.getItem('demo_balance') || '5240.50');
    const newBal = currentBal - amt;
    localStorage.setItem('demo_balance', newBal.toFixed(2));

    const txs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
    const newTx = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      type: 'SEND',
      amount: -amt,
      description: `Send to ${body.toUserName || 'User'} (${body.toUserId})`,
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    localStorage.setItem('demo_transactions', JSON.stringify(txs));

    responseData = { success: true };
  } else if (url.includes('/bills/pay')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    const amt = parseFloat(body.amount) || 0;
    const currentBal = parseFloat(localStorage.getItem('demo_balance') || '5240.50');
    const newBal = currentBal - amt;
    localStorage.setItem('demo_balance', newBal.toFixed(2));

    const bills = JSON.parse(localStorage.getItem('demo_bills') || '[]');
    const newBill = {
      id: 'bill-' + Math.random().toString(36).substring(2, 9),
      billerCode: body.billerCode || 'ELEC',
      billerName: body.billerName || 'Electricity',
      accountNumber: body.accountNumber || 'ACCT-12345',
      amount: amt.toFixed(2),
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    bills.unshift(newBill);
    localStorage.setItem('demo_bills', JSON.stringify(bills));

    const txs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
    const newTx = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      type: 'BILL_PAY',
      amount: -amt,
      description: body.description || `${body.billerName} Bill Payment`,
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    localStorage.setItem('demo_transactions', JSON.stringify(txs));

    responseData = { success: true };
  } else if (url.includes('/bills')) {
    const bills = JSON.parse(localStorage.getItem('demo_bills') || '[]');
    responseData = {
      success: true,
      data: {
        records: bills
      }
    };
  } else if (url.includes('/transactions')) {
    const txs = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
    responseData = {
      success: true,
      data: {
        transactions: txs
      }
    };
  }

  return {
    data: responseData,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config: config,
    request: {}
  };
};

// Request Interceptor: Attach JWT token and conditional mock adapter to every request
apiClient.interceptors.request.use(
  (config) => {
    if (localStorage.getItem('is_demo_mode') === 'true') {
      config.adapter = handleMockRequest;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend rejects our token, automatically log the user out
    if (error.response && error.response.status === 401) {
      console.error("401 ERROR Body:", error.response.data);
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
