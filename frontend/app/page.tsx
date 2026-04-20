'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Heart, Stethoscope, Building, ChevronRight, Star, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?disease=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Popular searches for quick access
  const popularSearches = [
    'Diabetes', 'Heart Disease', 'Fever', 'Headache', 'Eye Care', 'Dental'
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Fixed overflow for search bar visibility */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 pb-40 z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Trusted by 10,000+ patients across Nepal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Health,<br className="hidden sm:block" /> Our Priority
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Find the best hospitals and doctors near you. Book appointments instantly and manage your health records securely.
            </p>
            
            {/* Search Box - Enhanced with better visibility */}
            <div className="max-w-3xl mx-auto relative z-20">
              <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-3 md:p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by disease or symptoms..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </button>
                </div>
                
                {/* Popular searches */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-500">Popular:</span>
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        router.push(`/search?disease=${encodeURIComponent(term)}`);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-600 rounded-full transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </form>
            </div>
            
            {/* Quick actions */}
            <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-4">
              <Link
                href="/hospitals/map"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-5 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
              >
                <MapPin className="h-4 w-4" />
                Find Nearby Hospitals
              </Link>
              <Link
                href="/doctors"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-5 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
              >
                <Stethoscope className="h-4 w-4" />
                Browse Doctors
              </Link>
              <Link
                href="/hospitals"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-5 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
              >
                <Building className="h-4 w-4" />
                View All Hospitals
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave decoration - z-0 to stay behind content */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">18+</div>
              <div className="text-gray-600 mt-1">Hospitals</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">50+</div>
              <div className="text-gray-600 mt-1">Expert Doctors</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">10K+</div>
              <div className="text-gray-600 mt-1">Appointments</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600">4.8</div>
              <div className="text-gray-600 mt-1 flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Why Choose MediKit?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We connect you with the best healthcare providers in Nepal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Find Nearby Hospitals
              </h3>
              <p className="text-gray-600 mb-4">
                Locate hospitals and clinics near you with our interactive map. Filter by specialization and services.
              </p>
              <Link href="/hospitals/map" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
                Explore Map <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Easy Appointment Booking
              </h3>
              <p className="text-gray-600 mb-4">
                Book appointments with top doctors in just a few clicks. Choose your preferred date and time.
              </p>
              <Link href="/doctors" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
                Find Doctors <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure Health Records
              </h3>
              <p className="text-gray-600 mb-4">
                Access your medical records anytime. Keep track of prescriptions, reports, and health history.
              </p>
              <Link href="/dashboard" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
                View Dashboard <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Book an Appointment in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Search</h3>
              <p className="text-gray-600">
                Search for your disease or symptoms to find matching hospitals and specialists.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose</h3>
              <p className="text-gray-600">
                Select a doctor based on reviews, experience, and availability that suits you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Book</h3>
              <p className="text-gray-600">
                Pick a date and time, confirm your appointment, and get instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust MediKit for their healthcare needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg inline-flex items-center justify-center gap-2"
            >
              Create Free Account
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/hospitals"
              className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-4 rounded-xl font-semibold border border-primary-400 transition-all inline-flex items-center justify-center"
            >
              Browse Hospitals
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                MediKit
              </h3>
              <p className="text-gray-400 mb-6">
                Your trusted healthcare companion. Connecting patients with the best medical care in Nepal.
              </p>
              <div className="flex gap-4">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-gray-400 text-sm">24/7 Support Available</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/hospitals" className="hover:text-white transition-colors">Hospitals</Link></li>
                <li><Link href="/doctors" className="hover:text-white transition-colors">Doctors</Link></li>
                <li><Link href="/hospitals/map" className="hover:text-white transition-colors">Find Nearby</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 MediKit. All rights reserved. Made with ❤️ in Nepal</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
