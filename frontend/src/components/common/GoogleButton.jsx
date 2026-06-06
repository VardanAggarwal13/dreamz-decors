import { FcGoogle } from 'react-icons/fc';
import { toast } from 'sonner';
import { authClient } from '@/lib/authClient';

export default function GoogleButton({ label = 'Continue with Google' }) {
  const handleClick = async () => {
    try {
      // Redirects to Google, then back to callbackURL with a session cookie set.
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/account`,
        errorCallbackURL: `${window.location.origin}/login`,
      });
    } catch {
      toast.error('Google sign-in failed.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-hairline bg-white py-3.5 text-sm font-medium text-ink transition hover:border-gold/60 hover:bg-bone-soft"
    >
      <FcGoogle size={20} />
      {label}
    </button>
  );
}
