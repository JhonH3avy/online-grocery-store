import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { UserProfile, AuthModal } from './auth';
import { ShoppingCart, Leaf, UserIcon } from 'lucide-react';

interface NavigationProps {
  cartItems?: Record<string, number>;
  products?: any[];
  onCartDrawerOpen?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  cartItems = {}, 
  products = [],
  onCartDrawerOpen
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Calculate total items in cart with proper null checking
  const totalCartItems = cartItems && typeof cartItems === 'object' 
    ? Object.values(cartItems).reduce((sum: number, quantity: unknown) => {
        return sum + (typeof quantity === 'number' ? quantity : 0);
      }, 0)
    : 0;

  return (
    <>
      <nav className="bg-green-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Leaf className="h-8 w-8 text-white mr-2" />
                <span className="text-xl font-bold text-white">FreshMarket</span>
              </Link>
            </div>

            {/* Right side - Cart and auth */}
            <div className="flex items-center gap-4">
              {/* Cart button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 relative pr-4 cursor-pointer"
                onClick={onCartDrawerOpen || (() => {})}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Cart</span>
                {totalCartItems > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-semibold border border-white shadow-md"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {totalCartItems}
                  </span>
                )}
              </Button>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <UserProfile
                  onMyAccount={() => navigate('/profile')}
                  onOrderHistory={() => navigate('/profile/orders')}
                  onAddresses={() => {}} // Future feature
                  onSettings={() => {}} // Future feature
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
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