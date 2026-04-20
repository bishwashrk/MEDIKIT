'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Building,
  Users,
  UserPlus,
  LogOut,
  Shield,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'super_admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Hospitals', href: '/super-admin/hospitals', icon: Building },
    { name: 'Hospital Admins', href: '/super-admin/admins', icon: Users },
    { name: 'Patients', href: '/super-admin/patients', icon: Users },
    { name: 'Register Hospital', href: '/super-admin/register-hospital', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">MediKit</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileNavOpen((prev) => !prev)}
          className="p-2 rounded-md border border-gray-200 text-gray-700"
          aria-label="Toggle navigation"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-200 md:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Shield className="h-8 w-8 text-primary-500" />
          <div>
            <h1 className="text-lg font-bold text-white">MediKit</h1>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-1"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.first_name?.[0] || 'S'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.full_name || 'Super Admin'}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
