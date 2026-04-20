import Link from 'next/link';
import { ArrowLeft, Headphones, Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-10 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">MediKit Support</p>
              <h1 className="mt-2 text-3xl font-display font-bold">Contact Us</h1>
              <p className="mt-3 max-w-2xl text-emerald-50/95">
                Need help with appointments, payments, or account access? Reach us through any channel below.
              </p>
            </div>
            <Headset className="h-10 w-10 shrink-0 text-emerald-100" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-lg bg-cyan-50 p-2 text-cyan-700">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-slate-900">Email</h2>
            <p className="mt-1 text-sm text-slate-600">support@medikit.com</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Phone className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-slate-900">Phone</h2>
            <p className="mt-1 text-sm text-slate-600">+977-01-0000000</p>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-lg bg-amber-50 p-2 text-amber-700">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-slate-900">Office</h2>
            <p className="mt-1 text-sm text-slate-600">Kathmandu, Nepal</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <Link href="/help" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Link>
        </section>
      </div>
    </div>
  );
}
