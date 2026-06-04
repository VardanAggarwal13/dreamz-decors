import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/common/Logo';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to /api/auth/register
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <Logo variant="stacked" className="mb-8" />
        <div className="rounded-lg border border-ink/8 bg-bone-soft p-8 shadow-soft">
        <h1 className="font-display text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-ink/70">Join thousands styling their spaces with us.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-ink/60">Full Name</label>
            <Input
              required
              className="mt-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
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
              minLength={8}
              className="mt-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button variant="primary" size="lg" type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/70">
          Already a member?{' '}
          <Link to="/login" className="text-accent hover:text-accent-deep">Sign in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
