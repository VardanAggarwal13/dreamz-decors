// Minimal, inline-styled, email-client-safe HTML templates.
// All notifications reuse a single branded shell.

const BRAND = 'DreamzDecor';
const COLORS = {
  ink: '#161616',
  bone: '#f7f3ec',
  gold: '#c59e59',
  soft: '#5a5751',
};

function shell({ heading, body, ctaLabel, ctaUrl }) {
  const cta =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:8px 0 4px;">
           <a href="${ctaUrl}"
              style="display:inline-block;background:${COLORS.gold};color:#fff;text-decoration:none;
                     font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:999px;">
             ${ctaLabel}
           </a>
         </td></tr>`
      : '';

  return `<!doctype html>
<html>
  <body style="margin:0;background:${COLORS.bone};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bone};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#fff;border:1px solid #e7e1d6;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px;border-bottom:1px solid #efe9df;">
            <span style="font-size:18px;font-weight:700;letter-spacing:2px;">${BRAND.toUpperCase()}</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;">${heading}</h1>
            <div style="font-size:14px;line-height:1.7;color:${COLORS.soft};">${body}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">${cta}</table>
          </td></tr>
          <tr><td style="padding:22px 32px;border-top:1px solid #efe9df;font-size:11px;color:#9a948a;">
            You're receiving this because you have an account at ${BRAND}.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// Map a notification type to an email subject + HTML body.
// `ctx` carries data like { name, order }.
export function buildEmail(type, ctx = {}) {
  const name = ctx.name || 'there';
  const orderId = ctx.order?._id || ctx.orderId;
  const orderUrl = orderId ? `${clientUrl()}/account/orders/${orderId}` : `${clientUrl()}/account/orders`;
  const total = ctx.order?.total != null ? `₹${Number(ctx.order.total).toLocaleString('en-IN')}` : null;

  switch (type) {
    case 'order_placed':
      return {
        subject: `Order confirmed — thank you, ${name}!`,
        html: shell({
          heading: 'Your order is confirmed',
          body: `Hi ${name}, we've received your order${total ? ` of <strong>${total}</strong>` : ''}. We'll start preparing it and notify you the moment it ships.`,
          ctaLabel: 'View order',
          ctaUrl: orderUrl,
        }),
      };
    case 'order_paid':
      return {
        subject: 'Payment received',
        html: shell({
          heading: 'Payment received',
          body: `Hi ${name}, your payment${total ? ` of <strong>${total}</strong>` : ''} was successful. Your order is now being processed.`,
          ctaLabel: 'View order',
          ctaUrl: orderUrl,
        }),
      };
    case 'order_shipped':
      return {
        subject: 'Your order has shipped 🚚',
        html: shell({
          heading: 'On its way to you',
          body: `Good news, ${name}! Your order has been dispatched and is on its way. Tracking details will follow shortly.`,
          ctaLabel: 'Track order',
          ctaUrl: orderUrl,
        }),
      };
    case 'order_delivered':
      return {
        subject: 'Your order has been delivered',
        html: shell({
          heading: 'Delivered',
          body: `Hi ${name}, your order has been delivered. We hope you love it! Tap below to leave a review.`,
          ctaLabel: 'View order',
          ctaUrl: orderUrl,
        }),
      };
    case 'order_cancelled':
      return {
        subject: 'Your order was cancelled',
        html: shell({
          heading: 'Order cancelled',
          body: `Hi ${name}, your order has been cancelled. If this wasn't expected or you need a refund update, reply to this email.`,
          ctaLabel: 'View order',
          ctaUrl: orderUrl,
        }),
      };
    case 'order_refunded':
      return {
        subject: 'Refund processed',
        html: shell({
          heading: 'Refund processed',
          body: `Hi ${name}, your refund${total ? ` of <strong>${total}</strong>` : ''} has been processed and should reflect in your account soon.`,
          ctaLabel: 'View order',
          ctaUrl: orderUrl,
        }),
      };
    case 'account_welcome':
      return {
        subject: `Welcome to ${BRAND}`,
        html: shell({
          heading: `Welcome, ${name}!`,
          body: `Thanks for joining ${BRAND}. Explore hand-finished canvases, gallery sets, and statement pieces curated for spaces that linger.`,
          ctaLabel: 'Start shopping',
          ctaUrl: `${clientUrl()}/shop`,
        }),
      };
    default:
      return {
        subject: ctx.title || `Update from ${BRAND}`,
        html: shell({
          heading: ctx.title || 'Notification',
          body: ctx.message || '',
          ctaLabel: ctx.link ? 'View' : null,
          ctaUrl: ctx.link ? `${clientUrl()}${ctx.link}` : null,
        }),
      };
  }
}
