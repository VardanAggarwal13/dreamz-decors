import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/authClient';
import { useAuthStore } from '@/store/authStore';

export default function AccountProfile() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await authClient.updateUser({ name: profile.name, phone: profile.phone });
      if (error) throw new Error(error.message);
      setSession({ ...user, name: profile.name, phone: profile.phone });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error('New password must be at least 8 characters.');
    setSavingPw(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        revokeOtherSessions: false,
      });
      if (error) throw new Error(error.message);
      setPw({ current: '', next: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message || 'Could not change password (Google accounts have no password).');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <Seo title="Profile & Security — DreamzDecor" canonical="/account/profile" noIndex />
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Profile &amp; Security</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Profile */}
          <form onSubmit={saveProfile} className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Profile</h2>
            <div className="mt-5 space-y-4">
              <Field label="Name"><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></Field>
              <Field label="Email"><Input value={user?.email || ''} disabled className="opacity-60" /></Field>
              <Field label="Phone"><Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile" /></Field>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={savingProfile} className="mt-6 w-full">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </form>

          {/* Password */}
          <form onSubmit={changePassword} className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Change password</h2>
            <div className="mt-5 space-y-4">
              <Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} /></Field>
              <Field label="New password">
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="Min. 8 characters" className="pr-11" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" aria-label="Toggle">
                    {showPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </Field>
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={savingPw} className="mt-6 w-full">
              {savingPw ? 'Updating…' : 'Change password'}
            </Button>
            <p className="mt-3 text-[11px] leading-5 text-ink-muted">If you signed up with Google, you don’t have a password to change.</p>
          </form>
        </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
