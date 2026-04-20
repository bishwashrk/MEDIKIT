'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  Building,
  LayoutDashboard,
  Stethoscope,
  Layers,
  UserPlus,
  Calendar,
  LogOut,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/hospital-admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Hospital', href: '/hospital-admin/hospital', icon: <Building className="h-5 w-5" /> },
  { label: 'Doctors', href: '/hospital-admin/doctors', icon: <Stethoscope className="h-5 w-5" /> },
  { label: 'Departments', href: '/hospital-admin/departments', icon: <Layers className="h-5 w-5" /> },
  { label: 'Register Doctor', href: '/hospital-admin/register-doctor', icon: <UserPlus className="h-5 w-5" /> },
  { label: 'Appointments', href: '/hospital-admin/appointments', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Payments', href: '/hospital-admin/payments', icon: <CreditCard className="h-5 w-5" /> },
];

export default function HospitalAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'hospital_admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'hospital_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-800 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-green-700">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Hospital Admin</span>
              <p className="text-xs text-green-200">MediKit Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="px-4 py-4 border-t border-green-700">
            <div className="px-4 py-3 bg-white/10 rounded-lg mb-3">
              <p className="text-white font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-green-200 text-sm truncate">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                Hospital Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-green-100 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
