import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { Toaster } from 'sonner';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';
import { Navigation } from './components/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-white">
            {/* Global Navigation */}
            <Navigation />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<UserPage />} />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}