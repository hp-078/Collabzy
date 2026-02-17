import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Influencers from './pages/Influencers/Influencers';
import InfluencerDetail from './pages/InfluencerDetail/InfluencerDetail';
import Dashboard from './pages/Dashboard/Dashboard';
import Collaborations from './pages/Collaborations/Collaborations';
import Messages from './pages/Messages/Messages';
import Profile from './pages/Profile/Profile';
import Campaigns from './pages/Campaigns/Campaigns';
import CampaignDetail from './pages/CampaignDetail/CampaignDetail';
import Analytics from './pages/Analytics/Analytics';
import AdminPanel from './pages/Admin/AdminPanel';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          Collabzy
          <span className="loading-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children, showFooter = true }) => {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      {showFooter && <Footer />}
    </>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/influencers" element={<Layout><Influencers /></Layout>} />
      <Route path="/influencer/:id" element={<Layout><InfluencerDetail /></Layout>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/collaborations" element={
        <ProtectedRoute>
          <Layout><Collaborations /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <Layout showFooter={false}><Messages /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <Layout><Campaigns /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/campaigns/:id" element={
        <ProtectedRoute>
          <Layout><CampaignDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout><Analytics /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Layout><AdminPanel /></Layout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'white',
                  color: '#1A1A1A',
                  border: '1px solid rgba(255, 181, 186, 0.3)',
                  borderRadius: '16px',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 10px 40px rgba(255, 182, 193, 0.2), 0 4px 12px rgba(0,0,0,0.05)',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#98D8AA',
                    secondary: '#fff',
                  },
                  style: {
                    borderLeft: '4px solid #98D8AA',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#FF9B9B',
                    secondary: '#fff',
                  },
                  style: {
                    borderLeft: '4px solid #FF9B9B',
                  },
                },
              }}
            />
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
