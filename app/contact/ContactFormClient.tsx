'use client';
import { useState } from 'react';

export default function ContactFormClient() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErr('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      notes: String(fd.get('notes') || ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      setErr(String(e?.message || e));
      setStatus('error');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 620, marginTop: 16 }}>
      <label>Name<input name="name" required placeholder="Your name" autoFocus /></label>
      <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
      <label>Phone<input name="phone" type="tel" placeholder="+1 (___) ___-____" /></label>
      <label>Notes<textarea name="notes" rows={6} placeholder="Goals, context, timing" /></label>

      <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>

      {status === 'sent' && <div className="note">Submitted — we’ll follow up shortly.</div>}
      {status === 'error' && <div className="note">Request failed: {err}</div>}
    </form>
  );
}
