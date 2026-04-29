import api from './api';

const authService = {
  // Register new user - Step 1: Send OTP
  registerSendOTP: async (userData) => {
    const response = await api.post('/auth/register-send-otp', userData);
    return response.data;
  },

  // Register new user - Step 2: Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Forgot Password - Step 1: Send OTP to email
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Forgot Password - Step 2: Verify OTP and Reset Password
  verifyForgotOTP: async (email, otp, newPassword) => {
    const response = await api.post('/auth/verify-forgot-otp', {
      email,
      otp,
      newPassword
    });
    return response.data;
  },

  // Forgot Password - Resend OTP
  resendForgotOTP: async (email) => {
    const response = await api.post('/auth/resend-forgot-otp', { email });
    return response.data;
  },

  // Register new user (legacy - deprecated, use registerSendOTP + verifyOTP instead)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user data
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
