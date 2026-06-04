import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/common/Logo';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to /api/auth/login
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <Logo variant="stacked" className="mb-8" />
        <div className="rounded-lg border border-ink/8 bg-bone-soft p-8 shadow-soft">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/70">Sign in to track orders, save favourites and check out faster.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-ink/60">Email</label>
            <Input
              type="email"
              required
              className="mt-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-ink/60">Password</label>
            <Input
              type="password"
              required
              className="mt-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button variant="primary" size="lg" type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          New here?{' '}
          <Link to="/register" className="text-accent hover:text-accent-deep">
            Create an account
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
