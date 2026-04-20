'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage, paymentsApi } from '@/lib/api';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function EsewaSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment with eSewa...');
  const [secondsLeft, setSecondsLeft] = useState(6);

  const verifyMutation = useMutation({
    mutationFn: paymentsApi.verifyEsewaPayment,
    onSuccess: (response) => {
      setStatus('success');
      setMessage(response.message || 'Payment completed successfully.');
    },
    onError: (error) => {
      setStatus('failed');
      setMessage(getErrorMessage(error));
    },
  });

  const verifyPayment = verifyMutation.mutate;

  useEffect(() => {
    const data = searchParams.get('data');

    if (!data) {
      setStatus('failed');
      setMessage('Missing eSewa payment data.');
      return;
    }

    verifyPayment({ data });
  }, [searchParams, verifyPayment]);

  useEffect(() => {
    if (status !== 'success') {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          router.replace('/appointments?payment=success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [router, status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful</h1>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          </>
        )}

        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'success' && (
          <p className="text-sm text-emerald-700 mb-6">
            Redirecting to appointments in {secondsLeft}s to show the updated paid status.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/payments"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Payments
          </Link>
        </div>

        {status === 'failed' && (
          <div className="mt-6 flex items-start gap-2 text-left text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <p>If money was deducted but status still failed, wait 1-2 minutes then check payments history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
