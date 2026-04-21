'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function EsewaCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const failedStatus = searchParams.get('status');
    const data = searchParams.get('data');

    if (failedStatus === 'failed') {
      router.replace('/payments/esewa/failure');
      return;
    }

    if (!data) {
      router.replace('/payments/esewa/failure');
      return;
    }

    const query = new URLSearchParams({ data }).toString();
    router.replace(`/payments/esewa/success?${query}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the updated eSewa payment status page.</p>
      </div>
    </div>
  );
}

export default function EsewaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Redirecting...</h1>
            <p className="text-gray-600">Taking you to the updated eSewa payment status page.</p>
          </div>
        </div>
      }
    >
      <EsewaCallbackContent />
    </Suspense>
  );
}
