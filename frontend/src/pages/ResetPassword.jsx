import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import AuthShell from '@/components/common/AuthShell';
import { authClient } from '@/lib/authClient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const urlError = params.get('error');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const invalid = !token || urlError;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (err) {
      setError(err.message || 'Could not reset password. The link may have expired.');
      return;
    }
    toast.success('Password updated — please sign in.');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Seo title="Reset Password — DreamzDecor" canonical="/reset-password" noIndex />
      <AuthShell
        eyebrow="Account"
        title="Set a new password."
        description="Choose a strong password to secure your account."
        points={['Minimum 8 characters', 'Encrypted & secure', 'Sign in right after']}
      >
        <div>
          <p className="eyebrow-gold">Reset</p>
          <span className="gold-rule" />
          <h2 className="mt-4 font-display text-3xl text-ink">New password.</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Enter and confirm your new password.</p>
        </div>

        {invalid ? (
          <div className="mt-7 rounded-xl border border-sale/25 bg-sale/8 px-5 py-6 text-center text-sm text-sale">
            This reset link is invalid or has expired.
            <div className="mt-3">
              <Link to="/forgot-password" className="font-medium text-accent hover:text-accent-deep">
                Request a new link
              </Link>
            </div>
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
                New password
              </label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
                >
                  {showPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>
            <Button variant="primary" size="lg" type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        )}

        <p className="mt-7 text-center text-sm text-ink-soft">
          <Link to="/login" className="font-medium text-accent hover:text-accent-deep">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
