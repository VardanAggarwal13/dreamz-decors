import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '@/components/common/Seo';
import AuthShell from '@/components/common/AuthShell';
import GoogleButton from '@/components/common/GoogleButton';
import { authClient } from '@/lib/authClient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

function FieldLabel({ children }) {
  return (
    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">
      {children}
    </label>
  );
}

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: err } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    if (err) {
      setError(err.message || 'Unable to create account. Please try again.');
      setLoading(false);
      return;
    }
    setSession(data?.user || null);
    navigate('/account', { replace: true });
  };

  return (
    <>
      <Seo
        title="Create Account — DreamzDecor"
        description="Create your DreamzDecor account to save favourites and check out faster."
        canonical="/register"
        noIndex
      />
      <AuthShell
        eyebrow="Join Dreamz Decor"
        title="Start building your wall story today."
        description="Save pieces you love, track every order, and complete checkout in seconds — all in one place."
        points={['Faster, simpler checkout', 'Save and revisit favourites', 'Full order history']}
        cta={{ label: 'Already have an account? Sign in', href: '/login' }}
      >
        {/* Form heading */}
        <div>
          <p className="eyebrow-gold">Create Account</p>
          <span className="gold-rule" />
          <h2 className="mt-4 font-display text-3xl text-ink">Join Dreamz Decor.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Thousands of homeowners are already styling with us.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-sale/25 bg-sale/8 px-4 py-3 text-sm text-sale">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <div>
            <FieldLabel>Full name</FieldLabel>
            <Input
              required
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <FieldLabel>Email address</FieldLabel>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-ink-muted">or</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <GoogleButton label="Sign up with Google" />

        {/* Switch */}
        <p className="mt-7 text-center text-sm text-ink-soft">
          Already a member?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent-deep">
            Sign in
          </Link>
        </p>

        {/* Legal */}
        <p className="mt-5 text-center text-[11px] leading-5 text-ink-muted">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="underline hover:text-ink-soft">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline hover:text-ink-soft">Privacy Policy</Link>.
        </p>
      </AuthShell>
    </>
  );
}
