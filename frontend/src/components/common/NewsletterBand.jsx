import { useState } from 'react';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import api from '@/lib/api';

export default function NewsletterBand() {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('Please enter a valid email address.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = email.trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await api.post('/newsletter/subscribe', { email: val, source: 'website' });
      setStatus('success');
      setEmail('');
    } catch (err) {
      setErrorMsg(err.message || 'Could not subscribe. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="border-t border-hairline/60 bg-bone-muted py-16 sm:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">

          {/* Gold rule above eyebrow */}
          <span
            className="mx-auto mb-4 block h-px w-10"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgb(197 158 89), transparent)',
            }}
          />

          {/* Eyebrow */}
          <p className="eyebrow-gold">Stay in the loop</p>

          {/* Heading */}
          <h2 className="mt-3 font-display text-3xl text-balance text-ink sm:text-4xl">
            New drops. Studio stories.{' '}
            <em className="not-italic text-gold-deep">First access.</em>
          </h2>

          {/* Sub-copy */}
          <p className="mt-4 text-sm leading-7 text-ink-soft">
            Join 4,000+ homeowners and designers who get early access to new
            collections and limited-edition prints before anyone else.
          </p>

          {/* Form / Success */}
          {/* Form block — constrained width so input + button + footnote stay aligned */}
          <div className="mx-auto mt-8 w-full max-w-md">
            {status === 'success' ? (
              <div className="flex items-center justify-center gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-6 py-4 text-sm font-medium text-gold-deep">
                <FiCheck size={16} />
                You're in — welcome to the inner circle.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                    placeholder="your@email.com"
                    disabled={status === 'loading'}
                    className="min-w-0 flex-1 rounded-xl border border-hairline bg-bone-soft px-5 py-3.5 text-sm text-ink placeholder:text-ink-muted outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/15 disabled:opacity-60"
                    style={status === 'error' ? { borderColor: 'rgb(var(--color-sale) / 0.6)' } : {}}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gold-deep bg-gold-deep px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-bone transition hover:bg-gold disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                    {status !== 'loading' && <FiArrowRight size={14} />}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="mt-2 text-center text-xs text-sale">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}

            <p className="mt-3 text-center text-sm text-ink-muted">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
