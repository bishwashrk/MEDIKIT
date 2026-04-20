import Link from 'next/link';

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">Frequently Asked Questions</h1>
        <div>
          <h2 className="font-semibold text-slate-900">How do I book an appointment?</h2>
          <p className="text-slate-600 mt-1">Go to Hospitals or Doctors, pick a doctor, choose a slot, and complete payment.</p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Who can start chat?</h2>
          <p className="text-slate-600 mt-1">Only the booked patient can start a chat thread once payment is verified and appointment is confirmed.</p>
        </div>
        <Link href="/help" className="text-cyan-700 hover:underline">Back to Help Center</Link>
      </div>
    </div>
  );
}
