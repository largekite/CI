import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest){
  const started = Date.now(); console.log('[contact] POST /api/contact — start', { ts: started });
  try{
    const body = await req.json(); console.log('[contact] body', body);
    const { name, email, phone, notes } = body || {};
    if(!name || !email) { console.warn('[contact] 400 missing fields'); return new Response(JSON.stringify({ ok:false, error:'Missing name or email' }), { status:400 }); }
    const to = process.env.CONTACT_TO || process.env.RESEND_TO || ''; const apiKey = process.env.RESEND_API_KEY || '';
    const subject = `New consultation request — ${name}`;
    const html = `<div><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone||''}</p><p><strong>Notes:</strong><br/>${(notes||'').replace(/</g,'&lt;')}</p></div>`;
    if(apiKey && to){ console.log('[contact] Sending via Resend →', to); const { Resend } = await import('resend'); const resend = new Resend(apiKey); await resend.emails.send({ from: 'consult@' + (process.env.MAIL_FROM_DOMAIN || 'example.com'), to, subject, html }); }
    else { console.log('[contact] No email configured; logging payload only.'); }
    console.log('[contact] OK', { ms: Date.now()-started }); return new Response(JSON.stringify({ ok:true }), { headers:{'content-type':'application/json','cache-control':'no-store'} });
  } catch(e:any){ console.error('[contact] ERROR', e); return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500 }); }
}
export async function GET(){ return new Response('Use POST with JSON { name, email, phone, notes }', { status:405 }); }
