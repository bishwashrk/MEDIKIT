'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsApi, getErrorMessage, paymentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toaster';
import { Building2, Calendar, CreditCard, Loader2, ReceiptText } from 'lucide-react';

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  initiated: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/payments');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentsApi.getMyPayments,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const { data: myAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['myAppointments-for-payments'],
    queryFn: appointmentsApi.getMyAppointments,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const submitEsewaForm = (paymentUrl: string, fields: Record<string, string>) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const initiateEsewaMutation = useMutation({
    mutationFn: paymentsApi.initiateEsewaPayment,
    onSuccess: (response) => {
      const paymentUrl = response.data?.payment_url;
      const formFields = response.data?.form_fields;

      if (!paymentUrl || !formFields) {
        toast('Unable to connect to eSewa payment.', 'error');
        return;
      }

      toast('Redirecting to eSewa payment...', 'success');
      submitEsewaForm(paymentUrl, formFields);
    },
    onError: (error) => {
      toast(getErrorMessage(error), 'error');
    },
  });

  const payments = useMemo(() => data?.data ?? [], [data?.data]);
  const pendingAppointments = (myAppointments?.data?.upcoming || []).filter(
    (appointment) => appointment.status === 'pending'
  );

  const summary = useMemo(() => {
    const totalCount = payments.length;
    const paidCount = payments.filter((payment) => payment.status === 'completed').length;
    const totalPaid = payments
      .filter((payment) => payment.status === 'completed')
      .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);
    return { totalCount, paidCount, totalPaid };
  }, [payments]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Payment History</h1>
            <p className="text-gray-600">Track your consultation payments and receipts.</p>
            <p className="text-xs text-slate-500 mt-1">Live sync every 10 seconds</p>
          </div>
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{summary.paidCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">Rs. {summary.totalPaid.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
          <p className="text-sm text-gray-600 mt-1">Complete payment for pending appointments using eSewa.</p>

          {loadingAppointments ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : pendingAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">No pending appointment payments.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-cyan-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{appointment.reference_number}</p>
                    <p className="text-sm text-gray-600">
                      Dr. {appointment.doctor_name} | {appointment.hospital_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time.slice(0, 5)}
                    </p>
                    <p className="text-sm font-semibold text-primary-700 mt-1">
                      Amount: Rs. {Number(appointment.consultation_fee || 0).toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => initiateEsewaMutation.mutate(appointment.id)}
                    disabled={initiateEsewaMutation.isPending}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60"
                  >
                    {initiateEsewaMutation.isPending ? 'Processing...' : 'Pay with eSewa'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading && (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          )}

          {!isLoading && error && (
            <div className="py-16 text-center text-red-600">Failed to load payment history.</div>
          )}

          {!isLoading && !error && payments.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              <ReceiptText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              No payments found yet.
            </div>
          )}

          {!isLoading && !error && payments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Hospital</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Appointment</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gateway</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{payment.invoice_number}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div className="inline-flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {payment.hospital_name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{payment.appointment_reference}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div className="inline-flex items-center gap-1.5 capitalize">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          {payment.gateway}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">Rs. {Number(payment.amount).toFixed(2)}</td>
                      <td className="px-5 py-4 text-sm">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
