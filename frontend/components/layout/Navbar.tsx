'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Menu, X, User, LogOut, Calendar, Home, CreditCard, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canUseChat = isAuthenticated && (user?.role === 'doctor' || user?.role === 'patient');

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-600 to-blue-700 shadow-sm">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediKit</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/search"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Search by Disease
            </Link>
            <Link
              href="/hospitals"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Hospitals
            </Link>
            <Link
              href="/doctors"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Doctors
            </Link>
            <Link
              href="/hospitals/map"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Find Nearby
            </Link>
            {canUseChat && (
              <Link
                href="/chat"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Chat
              </Link>
            )}

            {isLoading ? (
              <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-slate-700 hover:text-cyan-700 transition-colors">
                  <div className="w-8 h-8 bg-cyan-50 rounded-full flex items-center justify-center ring-1 ring-cyan-200/70">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <span className="font-medium">{user?.first_name || 'User'}</span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href="/appointments"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    My Appointments
                  </Link>
                  <Link
                    href="/payments"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payments
                  </Link>
                  <Link
                    href="/chat"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/search"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Search by Disease
            </Link>
            <Link
              href="/hospitals"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Hospitals
            </Link>
            <Link
              href="/doctors"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Doctors
            </Link>
            <Link
              href="/hospitals/map"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Find Nearby
            </Link>
            {canUseChat && (
              <Link
                href="/chat"
                className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Chat
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <hr className="my-2" />
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/appointments"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Appointments
                </Link>
                <Link
                  href="/payments"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Payments
                </Link>
                <Link
                  href="/chat"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Chat
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <hr className="my-2" />
                <Link
                  href="/login"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-md text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
