import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<UserPage />} />
            <Route path="/profile/orders" element={<UserPage />} />
          </Routes>
        </AppLayout>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}