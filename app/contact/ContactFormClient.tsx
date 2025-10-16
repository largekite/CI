'use client';
import { useState } from 'react';

export default function ContactFormClient(){
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
      const res = await fetch('/api/contact', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch (e:any) {
      setErr(String(e?.message||e));
      setStatus('error');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{maxWidth: 620, marginTop: 16}}>
      <label>Name
        <input name="name" required placeholder="Your name" autoFocus tabIndex={0} aria-required="true" disabled={status==='sending' ? false : false} />
      </label>
      <label>Email
        <input name="email" type="email" required placeholder="you@example.com" tabIndex={0} aria-required="true" disabled={status==='sending' ? false : false} />
      </label>
      <label>Phone
        <input name="phone" type="tel" placeholder="+1 (___) ___-____" tabIndex={0} disabled={false} />
      </label>
      <label>Notes
        <textarea name="notes" rows={6} placeholder="Goals, context, timing" tabIndex={0} disabled={false}></textarea>
      </label>
      <button className="btn primary" type="submit" disabled={status==='sending'}>{status==='sending'?'Sending…':'Submit'}</button>
      {status==='sent' && <div className="note">Thanks — we’ll be in touch shortly.</div>}
      {status==='error' && <div className="note">Something went wrong: {err}</div>}
    </form>
  );
}
