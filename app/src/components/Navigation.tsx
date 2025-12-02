import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { Button } from './ui/button';
import { UserProfile, AuthModal } from './auth';
import { ShoppingCart, Leaf, UserIcon } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { getTotalItems, setCartDrawerOpen } = useCart();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Get total items in cart
  const totalCartItems = getTotalItems();

  return (
    <>
      <nav className="bg-green-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Leaf className="h-8 w-8 text-white mr-2" />
                <span className="text-xl font-bold text-white">FreshMarket</span>
              </Link>
              
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    location.pathname === '/'
                      ? 'border-white text-white'
                      : 'border-transparent text-green-100 hover:text-white hover:border-green-300'
                  }`}
                >
                  Shop
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/profile"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                      location.pathname === '/profile'
                        ? 'border-white text-white'
                        : 'border-transparent text-green-100 hover:text-white hover:border-green-300'
                    }`}
                  >
                    My Account
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Cart and auth */}
            <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="md"
                  className="text-white hover:bg-white/10"
                  onClick={() => setCartDrawerOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="ml-2 hidden sm:inline">Cart</span>
                {totalCartItems > 0 && (
                  <span className="w-5 h-5 cart-badge-red text-white rounded-full text-xs font-bold leading-none flex items-center justify-center border-2 border-white shadow-md">
                    {totalCartItems}
                  </span>
                )}
              </Button>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <UserProfile
                  onOrderHistory={() => {}} // Handled by navigation
                  onAddresses={() => {}} // Future feature
                  onSettings={() => {}} // Future feature
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    className="text-white hover:bg-white/10"
                    onClick={() => {
                      setAuthModalMode('login')
                      setShowAuthModal(true)
                    }}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-green-600 hover:bg-green-50"
                    onClick={() => {
                      setAuthModalMode('register')
                      setShowAuthModal(true)
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authModalMode}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
};