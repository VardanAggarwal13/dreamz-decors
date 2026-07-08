import * as React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// Password field with a show/hide eye toggle. Behaves exactly like <Input>,
// just forces a text/password type based on the internal reveal state.
export const PasswordInput = React.forwardRef(function PasswordInput(
  { className, ...props },
  ref
) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted transition hover:text-ink"
      >
        {show ? <FiEyeOff size={17} /> : <FiEye size={17} />}
      </button>
    </div>
  );
});
