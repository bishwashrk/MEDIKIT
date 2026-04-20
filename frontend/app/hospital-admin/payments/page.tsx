'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { Calendar, CreditCard, Loader2, ReceiptText, RefreshCw, TrendingUp, User } from 'lucide-react';

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  initiated: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function HospitalPaymentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hospital-payments'],
    queryFn: paymentsApi.getHospitalPayments,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const payments = useMemo(() => data?.data || [], [data?.data]);

  const summary = useMemo(() => {
    const totalTransactions = payments.length;
    const completed = payments.filter((payment) => payment.status === 'completed');
    const revenue = completed.reduce((acc, payment) => acc + Number(payment.amount || 0), 0);
    return {
      totalTransactions,
      paidCount: completed.length,
      revenue,
    };
  }, [payments]);

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-emerald-100">Monitor all hospital transactions with automatic live updates.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
            <RefreshCw className="h-4 w-4" />
            Auto refresh: 10s
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalTransactions}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{summary.paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Revenue</p>
          <div className="mt-1 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <p className="text-2xl font-bold text-primary-700">Rs. {summary.revenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        {!isLoading && error && (
          <div className="py-16 text-center text-red-600">Failed to load payment data.</div>
        )}

        {!isLoading && !error && payments.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <ReceiptText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            No payment transactions found.
          </div>
        )}

        {!isLoading && !error && payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Appointment</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gateway</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      <div>{payment.invoice_number}</div>
                      <div className="text-xs text-slate-500 mt-1">TX: {payment.transaction_id}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-8 w-8 rounded-full bg-cyan-100 text-cyan-700 inline-flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </span>
                        <span>{payment.patient_name || payment.patient_email || 'N/A'}</span>
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
  );
}
