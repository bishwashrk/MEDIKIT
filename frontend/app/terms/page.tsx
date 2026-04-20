import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-3 text-slate-600">By using MediKit, you agree to provide accurate information and use the platform responsibly.</p>
        <div className="mt-6">
          <Link href="/privacy" className="text-cyan-700 hover:underline">Read Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
