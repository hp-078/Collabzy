import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
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

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <DataProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
