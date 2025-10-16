import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest){
  try{
    const { name, email, phone, notes } = await req.json();
    if (!name || !email) return new Response(JSON.stringify({ ok:false, error:'Missing name or email' }), { status: 400 });

    const to = process.env.CONTACT_TO || process.env.RESEND_TO || '';
    const apiKey = process.env.RESEND_API_KEY || '';
    const subject = `New consultation request — ${name}`;
    const html = `<div>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone||''}</p>
      <p><strong>Notes:</strong><br/>${(notes||'').replace(/</g,'&lt;')}</p>
    </div>`;

    if (apiKey && to) {
      // Lazy import to avoid bundling if not configured
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'consult@' + (process.env.MAIL_FROM_DOMAIN || 'example.com'),
        to, subject, html
      });
    } else {
      console.log('[contact] To configure email, set RESEND_API_KEY and CONTACT_TO. Fallback logging only.');
      console.log({ name, email, phone, notes });
    }

    return new Response(JSON.stringify({ ok:true }), { headers: { 'content-type':'application/json' } });
  }catch(e:any){
    console.error(e);
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status: 500 });
  }
}

export async function GET(){
  return new Response('Use POST with JSON { name, email, phone, notes }', { status: 405 });
}
