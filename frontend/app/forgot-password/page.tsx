import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">Forgot Password</h1>
        <p className="mt-3 text-slate-600">Password reset flow is not enabled yet. Please contact support for account recovery.</p>
        <div className="mt-6">
          <Link href="/login" className="text-cyan-700 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
