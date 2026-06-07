import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/orders/${orderId}`)
      .then((res) => !cancelled && setOrder(res.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="bg-bone">
      <Seo title="Order Confirmed — DreamzDecor" canonical={`/order-success/${orderId}`} noIndex />

      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/15">
          <FiCheck size={30} className="text-gold-deep" />
        </div>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.3em] text-gold-deep">Thank you</p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">Order confirmed</h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-ink-soft">
          Your order <span className="font-medium text-ink">{shortId(orderId)}</span> has been placed.
          A confirmation has been sent to your email and notifications.
        </p>

        {order && (
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-hairline/60 bg-bone-soft p-6 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Order</span>
              <span className="font-medium text-ink">{shortId(order._id)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Items</span>
              <span className="text-ink">{order.items?.length || 0}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Payment</span>
              <span className="uppercase text-ink">{order.payment?.method === 'cod' ? 'COD' : 'Razorpay'}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-hairline/60 pt-3">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-xl text-gold-deep">{formatINR(order.total)}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link to={`/account/orders/${orderId}`}>View order <FiArrowRight /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
