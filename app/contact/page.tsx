'use client';
import { useState } from 'react';

export default function ContactPage(){
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setStatus('sending'); setErr('');
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name')||''),
      email: String(fd.get('email')||''),
      phone: String(fd.get('phone')||''),
      notes: String(fd.get('notes')||''),
    };
    try {
      const res = await fetch('/api/contact', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (e:any) {
      setErr(String(e?.message||e));
      setStatus('error');
    }
  }

  return (
    <main className="section">
      <div className="eyebrow">Get in touch</div>
      <h1 className="h2">Book a consultation</h1>
      <p className="content">Tell us a bit about you and what you’d like help with. We’ll reply by email to schedule a call.</p>

      <form onSubmit={onSubmit} style={{maxWidth: 620, marginTop: 16}}>
        <label>Name<input name="name" required placeholder="Your name" /></label>
        <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>Phone<input name="phone" type="tel" placeholder="+1 (___) ___-____" /></label>
        <label>Notes<textarea name="notes" rows={6} placeholder="Goals, context, timing"></textarea></label>
        <button className="btn primary" type="submit" disabled={status==='sending'}>{status==='sending'?'Sending…':'Submit'}</button>
        {status==='sent' && <div className="note">Thanks — we’ll be in touch shortly.</div>}
        {status==='error' && <div className="note">Something went wrong: {err}</div>}
      </form>
    </main>
  );
}
