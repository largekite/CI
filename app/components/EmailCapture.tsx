'use client';

import { useState } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: 'early-access',
          message: 'Early access signup from homepage',
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        // Reset after 3 seconds
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="email-form-success">
        <p>✓ Thanks! Check your inbox for updates.</p>
      </div>
    );
  }

  return (
    <form className="email-form" onSubmit={handleSubmit}>
      <input 
        type="email" 
        placeholder="your@email.com" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required 
        disabled={loading}
      />
      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Get Early Access'}
      </button>
    </form>
  );
}
