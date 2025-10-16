export const metadata = { title: 'Contact — LargeKite Capital' };

export default function Contact() {
  return (
    <main className="section">
      <div className="eyebrow">Let’s talk</div>
      <h1 className="h2">Book a consultation</h1>
      <p className="content">Prefer email? <a href="mailto:hello@largekitecapital.com">hello@largekitecapital.com</a></p>
      <form method="post" action="/api/contact" className="card" style={{maxWidth:680}}>
        <label>Name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Message<textarea name="message" rows={6} required placeholder="Tell us your goal, timeline, constraints…" /></label>
        <label className="tiny"><input type="checkbox" name="consent" required /> I agree to be contacted and I’ve read the brief privacy note.</label>
        <button className="btn primary" type="submit">Send</button>
      </form>
    </main>
  );
}
