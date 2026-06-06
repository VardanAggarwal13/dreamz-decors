import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function Account() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-bone-soft">
      <Seo
        title="My Account - DreamzDecor"
        description="Manage your Dreamz Decor profile, orders, and saved items."
        canonical="/account"
        noIndex
      />
      <div className="container-page py-12">
        <div className="surface-card overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-hairline bg-bone p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <span className="eyebrow">Account</span>
              <h1 className="mt-3 max-w-md font-display text-4xl leading-[0.95] text-ink sm:text-5xl">
                Welcome back, {user?.name || 'friend'}.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-soft">
                Use this space to review your profile, keep track of orders, and move around the store faster.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-ink-soft">
                <div className="rounded-2xl border border-hairline bg-bone-soft p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Email</div>
                  <div className="mt-2 text-ink">{user?.email || 'Not available'}</div>
                </div>
                <div className="rounded-2xl border border-hairline bg-bone-soft p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-ink-muted">Role</div>
                  <div className="mt-2 text-ink capitalize">{user?.role || 'customer'}</div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/account/orders"
                  className="group rounded-2xl border border-hairline bg-bone-soft p-5 transition hover:border-gold/40 hover:shadow-card"
                >
                  <div className="eyebrow">Orders</div>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">
                    Track your orders and view live status updates for every purchase.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-gold-deep">
                    View orders <FiArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <div className="rounded-2xl border border-hairline bg-bone-soft p-5">
                  <div className="eyebrow">Saved Items</div>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">
                    Keep your favorite wall art and bundles ready for the next checkout.
                  </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-bone-soft p-5">
                  <div className="eyebrow">Support</div>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">
                    If something feels off, reach out through email or phone from the contact page.
                  </p>
                </div>
                <div className="rounded-2xl border border-hairline bg-bone-soft p-5">
                  <div className="eyebrow">Shop</div>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">
                    Continue browsing the collection and add more pieces to your cart.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="primary" size="lg">
                  <Link to="/shop">Browse Collection</Link>
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
