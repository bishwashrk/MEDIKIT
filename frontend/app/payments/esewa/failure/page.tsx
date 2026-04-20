'use client';

import Link from 'next/link';
import { AlertCircle, XCircle } from 'lucide-react';

export default function EsewaFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <XCircle className="h-10 w-10 text-red-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          Your eSewa payment was cancelled or could not be completed. No worries, you can try again.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/payments"
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Try Payment Again
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-6 flex items-start gap-2 text-left text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p>If your wallet was debited, check payment history after 1-2 minutes or contact support.</p>
        </div>
      </div>
    </div>
  );
}
