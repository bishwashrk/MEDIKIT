import Link from 'next/link';
import { BookOpen, Headphones, LifeBuoy, MessageSquareText } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-600 to-emerald-600 px-8 py-10 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">Support Desk</p>
              <h1 className="mt-2 text-3xl font-display font-bold">Help Center</h1>
              <p className="mt-3 max-w-2xl text-cyan-50/95">
                Find quick answers, practical guides, and direct support channels for appointments, payments, and account issues.
              </p>
            </div>
            <LifeBuoy className="h-10 w-10 shrink-0 text-cyan-100" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/faq" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50">
              <BookOpen className="h-4 w-4" />
              Browse FAQ
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              <Headset className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Appointments</h2>
            <p className="mt-2 text-sm text-slate-600">Rescheduling, cancellations, slot visibility, and booking confirmations.</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Payments</h2>
            <p className="mt-2 text-sm text-slate-600">eSewa redirects, verification status, and invoice confirmation timelines.</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Account & Access</h2>
            <p className="mt-2 text-sm text-slate-600">Login issues, role restrictions, profile updates, and security options.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-0.5 h-5 w-5 text-cyan-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Still need help?</h3>
              <p className="mt-1 text-sm text-slate-600">Our support team usually responds within one business day.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
