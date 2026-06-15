import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const setSession = useAuthStore((s) => s.setSession);
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/account';

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: err } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });
    if (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }
    setSession(data?.user || null);
    const firstName = data?.user?.name?.trim().split(/\s+/)[0];
    toast.success(firstName ? `Welcome back, ${firstName}!` : 'Welcome back!');
    navigate(from, { replace: true });
  };

  return (
    <>
      <Seo
        title="Sign In — DreamzDecor"
        description="Sign in to track orders, save favourites, and check out faster."
        canonical="/login"
        noIndex
      />
      <AuthShell
        eyebrow="Welcome back"
        title="Your wall story continues here."
        description="Access saved pieces, track orders, and move through checkout without the friction."
        points={['Track every order live', 'Save and revisit favourites', 'One-tap checkout']}
        cta={{ label: "Don't have an account? Join us", href: '/register' }}
      >
        {/* Form heading */}
        <div>
          <p className="eyebrow-gold">Sign In</p>
          <span className="gold-rule" />
          <h2 className="mt-4 font-display text-3xl text-ink">Welcome back.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Sign in to access your orders and saved pieces.
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
            <div className="mb-1.5 flex items-center justify-between">
              <FieldLabel>Password</FieldLabel>
              <Link
                to="/forgot-password"
                className="text-[11px] text-ink-muted transition hover:text-accent"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              placeholder="••••••••"
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
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-ink-muted">or</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <GoogleButton />

        {/* Switch */}
        <p className="mt-7 text-center text-sm text-ink-soft">
          New to Dreamz Decor?{' '}
          <Link to="/register" className="font-medium text-accent hover:text-accent-deep">
            Create an account
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
