import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import AuthShell from '@/components/common/AuthShell';
import { authClient } from '@/lib/authClient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message || 'Could not send the reset email. Please try again.');
      return;
    }
    setSent(true);
  };

  return (
    <>
      <Seo title="Forgot Password — DreamzDecor" canonical="/forgot-password" noIndex />
      <AuthShell
        eyebrow="Account"
        title="Forgot your password?"
        description="No worries — we'll email you a secure link to set a new one."
        points={['Secure reset link', 'Expires shortly', 'Back to shopping in minutes']}
      >
        <div>
          <p className="eyebrow-gold">Reset</p>
          <span className="gold-rule" />
          <h2 className="mt-4 font-display text-3xl text-ink">Reset password.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Enter your account email and we'll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="mt-7 rounded-xl border border-gold/30 bg-gold/[0.07] px-5 py-6 text-center">
            <FiMail className="mx-auto text-gold-deep" size={24} />
            <p className="mt-3 text-sm font-medium text-ink">Check your inbox</p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a reset
              link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            {error && (
              <div className="rounded-xl border border-sale/25 bg-sale/8 px-4 py-3 text-sm text-sale">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">
                Email address
              </label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="mt-7 text-center text-sm text-ink-soft">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-accent hover:text-accent-deep">
            <FiArrowLeft size={13} /> Back to sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
