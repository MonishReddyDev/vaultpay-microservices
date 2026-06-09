import axios from 'axios';

// Create an Axios instance pointing to the API Gateway
const API_URL = import.meta.env.VITE_API_URL || 'https://18-218-110-14.nip.io/api';

const apiClient = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    // 💡 INTERVIEW NOTE: 
    // In a strict financial production app, we would store an HttpOnly refresh cookie 
    // and hold the access JWT purely in React state.
    // For this prototype, we use localStorage for simplicity to keep the user logged in across reloads.
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
