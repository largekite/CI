import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const message = String(form.get('message') || '');
    const consent = String(form.get('consent') || '') === 'on';

    if (!name || !email || !message || !consent) {
      return new Response('Missing fields', { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.CONTACT_TO || 'hello@largekitecapital.com';

    await resend.emails.send({
      from: 'LargeKite Capital <noreply@largekitecapital.com>',
      to,
      reply_to: email,
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nConsent: ${consent ? 'Yes' : 'No'}`
    });

    return new Response(null, { status: 302, headers: { Location: '/contact?sent=1' }});
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500 });
  }
}
