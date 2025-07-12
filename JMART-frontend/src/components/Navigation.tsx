
import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Upload, Store, List, Book, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokenBalance = async () => {
    try {
      // Dummy user_id=1
      const res = await fetch('http://127.0.0.1:8000/api/token-balance?user_id=1');
      const data = await res.json();
      setTokenBalance(data.token_balance || 0);
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenBalance();
    
    // Set up interval to refresh balance every 30 seconds
    const interval = setInterval(fetchTokenBalance, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Listen for custom events to update balance immediately after transactions
  useEffect(() => {
    const handleBalanceUpdate = () => {
      fetchTokenBalance();
    };

    window.addEventListener('tokenBalanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('tokenBalanceUpdated', handleBalanceUpdate);
    };
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload Waste', href: '/upload', icon: Upload },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'My Listings', href: '/listings', icon: List },
    { name: 'DIY Ideas', href: '/diy', icon: Book },
    { name: 'Token Shop', href: '/token-shop', icon: Store, showToken: true },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white shadow-lg border-b-2 border-eco-primary/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Junk Mart Logo" 
              className="h-40 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-eco-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-eco-light hover:text-eco-primary-dark'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                  {item.showToken && (
                    <span className="ml-2 px-2 py-1 bg-eco-primary text-white rounded text-xs">
                      {isLoading ? '...' : `${tokenBalance} tokens`}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="text-gray-700 hover:bg-eco-light"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-eco-primary text-white'
                        : 'text-gray-700 hover:bg-eco-light hover:text-eco-primary-dark'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                  {item.showToken && (
                    <span className="ml-auto px-2 py-1 bg-eco-primary text-white rounded text-xs">
                      {isLoading ? '...' : `${tokenBalance} tokens`}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
