
import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Upload, Store, List, Book, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LogoutButton from './LogoutButton';
import { useAuth } from '../lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import md5 from 'blueimp-md5';

export default function Navigation() {
  const { user } = useAuth();

  // Debug logging
  console.log('Navigation - User state:', user);
  console.log('Navigation - localStorage user:', localStorage.getItem('user'));
  console.log('Navigation - localStorage token:', localStorage.getItem('token'));

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload Waste', href: '/upload', icon: Upload },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'My Listings', href: '/listings', icon: List },
    { name: 'DIY Ideas', href: '/diy', icon: Book },
    { name: 'Token Shop', href: '/token-shop', icon: Store, showToken: true },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white shadow-lg border-b-2 border-eco-primary/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <img 
              src="/logo.png" 
              alt="Junk Mart Logo" 
              className="h-40 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-1 list-none m-0 p-0 flex-1 justify-center">
            {navItems.map((item) => (
              <li key={item.name} className="m-0 p-0">
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
                      {user ? `${user.tokens} tokens` : '0 tokens'}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
            {user && (
              <li className="m-0 p-0">
                <LogoutButton />
              </li>
            )}
          </ul>

          {/* User Avatar & Name on the right */}
          <div className="flex items-center space-x-2 ml-4">
            <Avatar className="h-10 w-10 border-2 border-gray-300 bg-blue-100">
              {user ? (
                <>
                  <AvatarImage
                    src={`https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=64`}
                    alt={user.username}
                  />
                  <AvatarFallback className="bg-blue-500 text-white text-sm font-bold">
                    {user.username[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-gray-400 text-white text-sm font-bold">
                  ?
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user ? user.username : 'Guest'}
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-2">
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
            <ul className="px-2 pt-2 pb-3 space-y-1 list-none m-0 p-0">
              {navItems.map((item) => (
                <li key={item.name} className="m-0 p-0">
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
                        {user ? `${user.tokens} tokens` : '0 tokens'}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
              {user && (
                <li className="m-0 p-0">
                  <LogoutButton />
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
