'use client';
export default function FloatingNav(){
  const backToTop = () => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { window.scrollTo(0,0); } };
  return (
    <div className="floating-nav" role="navigation" aria-label="Quick navigation">
      <button className="fab" onClick={backToTop} aria-label="Back to top">↑</button>
      <a className="fab" href="/" aria-label="Back to main page">⌂</a>
    </div>
  );
}
