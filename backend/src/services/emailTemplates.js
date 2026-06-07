// Professional, reusable, email-client-safe HTML templates.
//
// Every email the app sends — transactional (orders, account) and marketing
// (newsletter) — is rendered through ONE branded shell, `renderEmail()`. Each
// message only varies its content: heading, body, optional banner image, CTA,
// and footer note. Change the look in one place and all emails update.

const BRAND = 'DreamzDecors';
const TAGLINE = 'Premium wall art, gallery sets & decor';

const COLORS = {
  ink: '#161616',
  inkSoft: '#5a5751',
  bone: '#f7f3ec',
  boneMuted: '#efe9df',
  line: '#e7e1d6',
  gold: '#c59e59',
  goldDeep: '#a17f37',
  muted: '#9a948a',
};

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const supportEmail = () => process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || 'support@dreamzdecors.com';
const currentYear = () => new Date().getFullYear();

// A premium pill button. Returns '' when label/url missing.
// Uses the brand deep-gold to match the site's standardized primary buttons.
function button(label, url) {
  if (!label || !url) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
    <tr><td style="border-radius:999px;background:${COLORS.goldDeep};">
      <a href="${url}"
         style="display:inline-block;padding:13px 30px;border-radius:999px;background:${COLORS.goldDeep};
                color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;
                text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
        ${label}
      </a>
    </td></tr>
  </table>`;
}

/**
 * The single branded email shell.
 * @param {object} o
 * @param {string} o.preheader      Hidden inbox-preview text.
 * @param {string} o.heading        Big title inside the card.
 * @param {string} o.bodyHtml       Message HTML (already safe/intended HTML).
 * @param {{label:string,url:string}} [o.cta]  Optional call-to-action button.
 * @param {string} [o.imageUrl]     Optional full-width banner under the header.
 * @param {string} [o.footerNote]   Why-you-got-this line (defaults to account copy).
 * @param {string} [o.unsubscribeUrl] Adds an unsubscribe link to the footer.
 */
function renderEmail({ preheader, heading, bodyHtml, cta, imageUrl, footerNote, unsubscribeUrl }) {
  const banner = imageUrl
    ? `<tr><td style="padding:0;">
         <img src="${imageUrl}" alt="" width="600"
              style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
       </td></tr>`
    : '';

  const ctaHtml = cta ? button(cta.label, cta.url) : '';

  const note = footerNote || `You're receiving this email because you have an account with ${BRAND}.`;
  const unsubscribe = unsubscribeUrl
    ? ` &nbsp;·&nbsp; <a href="${unsubscribeUrl}" style="color:${COLORS.muted};text-decoration:underline;">Unsubscribe</a>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bone};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink};-webkit-font-smoothing:antialiased;">
  <!-- preheader: shown as inbox preview, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    ${preheader || ''}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bone};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border:1px solid ${COLORS.line};border-radius:18px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="padding:30px 36px 22px;text-align:center;border-bottom:1px solid ${COLORS.boneMuted};">
          <div style="font-size:20px;font-weight:700;letter-spacing:3px;color:${COLORS.ink};">
            DREAMZ<span style="color:${COLORS.gold};">DECORS</span>
          </div>
          <div style="margin-top:6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};">
            ${TAGLINE}
          </div>
          <div style="margin:16px auto 0;width:40px;height:2px;background:${COLORS.gold};"></div>
        </td></tr>

        ${banner}

        <!-- Content -->
        <tr><td style="padding:36px;">
          <h1 style="margin:0 0 16px;font-size:23px;line-height:1.3;color:${COLORS.ink};font-weight:700;">${heading}</h1>
          <div style="font-size:15px;line-height:1.75;color:${COLORS.inkSoft};">${bodyHtml}</div>
          ${ctaHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 36px 28px;border-top:1px solid ${COLORS.boneMuted};background:${COLORS.bone};">
          <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${COLORS.inkSoft};">
            Questions? Reach us at
            <a href="mailto:${supportEmail()}" style="color:${COLORS.goldDeep};text-decoration:none;">${supportEmail()}</a>.
          </p>
          <p style="margin:0;font-size:11px;line-height:1.7;color:${COLORS.muted};">
            ${note}${unsubscribe}
          </p>
          <p style="margin:12px 0 0;font-size:11px;color:${COLORS.muted};">
            © ${currentYear()} ${BRAND} · <a href="${clientUrl()}" style="color:${COLORS.muted};text-decoration:underline;">dreamzdecors.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Transactional emails (orders, account) ────────────────────────────────────

// Map a notification type to a branded email. `ctx` carries { name, order, … }.
export function buildEmail(type, ctx = {}) {
  const name = ctx.name || 'there';
  const orderId = ctx.order?._id || ctx.orderId;
  const orderUrl = orderId ? `${clientUrl()}/account/orders/${orderId}` : `${clientUrl()}/account/orders`;
  const total = ctx.order?.total != null ? `₹${Number(ctx.order.total).toLocaleString('en-IN')}` : null;
  const viewOrder = { label: 'View order', url: orderUrl };

  switch (type) {
    case 'order_placed':
      return {
        subject: `Order confirmed — thank you, ${name}!`,
        html: renderEmail({
          preheader: `We've received your order${total ? ` of ${total}` : ''}.`,
          heading: 'Your order is confirmed',
          bodyHtml: `Hi ${name}, we've received your order${total ? ` of <strong>${total}</strong>` : ''}. We'll start preparing it and notify you the moment it ships.`,
          cta: viewOrder,
        }),
      };
    case 'order_paid':
      return {
        subject: 'Payment received',
        html: renderEmail({
          preheader: `Your payment${total ? ` of ${total}` : ''} was successful.`,
          heading: 'Payment received',
          bodyHtml: `Hi ${name}, your payment${total ? ` of <strong>${total}</strong>` : ''} was successful. Your order is now being processed.`,
          cta: viewOrder,
        }),
      };
    case 'order_shipped':
      return {
        subject: 'Your order has shipped 🚚',
        html: renderEmail({
          preheader: 'Your order is on its way.',
          heading: 'On its way to you',
          bodyHtml: `Good news, ${name}! Your order has been dispatched and is on its way. Tracking details will follow shortly.`,
          cta: { label: 'Track order', url: orderUrl },
        }),
      };
    case 'order_delivered':
      return {
        subject: 'Your order has been delivered',
        html: renderEmail({
          preheader: 'We hope you love it!',
          heading: 'Delivered',
          bodyHtml: `Hi ${name}, your order has been delivered. We hope you love it! Tap below to leave a review.`,
          cta: viewOrder,
        }),
      };
    case 'order_cancelled':
      return {
        subject: 'Your order was cancelled',
        html: renderEmail({
          preheader: 'Your order has been cancelled.',
          heading: 'Order cancelled',
          bodyHtml: `Hi ${name}, your order has been cancelled. If this wasn't expected or you need a refund update, reply to this email.`,
          cta: viewOrder,
        }),
      };
    case 'order_refunded':
      return {
        subject: 'Refund processed',
        html: renderEmail({
          preheader: `Your refund${total ? ` of ${total}` : ''} has been processed.`,
          heading: 'Refund processed',
          bodyHtml: `Hi ${name}, your refund${total ? ` of <strong>${total}</strong>` : ''} has been processed and should reflect in your account soon.`,
          cta: viewOrder,
        }),
      };
    case 'account_welcome':
      return {
        subject: `Welcome to ${BRAND}`,
        html: renderEmail({
          preheader: 'Hand-finished canvases, gallery sets and statement pieces await.',
          heading: `Welcome, ${name}!`,
          bodyHtml: `Thanks for joining ${BRAND}. Explore hand-finished canvases, gallery sets, and statement pieces curated for spaces that linger.`,
          cta: { label: 'Start shopping', url: `${clientUrl()}/shop` },
        }),
      };
    case 'admin_new_order':
      return {
        subject: `New order received${total ? ` — ${total}` : ''}`,
        html: renderEmail({
          preheader: `A new order was placed${total ? ` for ${total}` : ''}.`,
          heading: 'New order received',
          bodyHtml: `A new order has been placed${ctx.customerName ? ` by <strong>${ctx.customerName}</strong>` : ''}${total ? ` for <strong>${total}</strong>` : ''}. Open the dashboard to review and process it.`,
          cta: { label: 'Open admin orders', url: `${clientUrl()}/admin/orders` },
        }),
      };
    case 'admin_order_paid':
      return {
        subject: `Payment received${total ? ` — ${total}` : ''}`,
        html: renderEmail({
          preheader: `Payment confirmed${total ? ` of ${total}` : ''}.`,
          heading: 'Payment received',
          bodyHtml: `Payment has been confirmed${ctx.customerName ? ` from <strong>${ctx.customerName}</strong>` : ''}${total ? ` for <strong>${total}</strong>` : ''}. The order is ready to be processed and shipped.`,
          cta: { label: 'Open admin orders', url: `${clientUrl()}/admin/orders` },
        }),
      };
    default:
      return {
        subject: ctx.title || `Update from ${BRAND}`,
        html: renderEmail({
          preheader: ctx.message || '',
          heading: ctx.title || 'Notification',
          bodyHtml: ctx.message || '',
          cta: ctx.link ? { label: 'View', url: `${clientUrl()}${ctx.link}` } : undefined,
        }),
      };
  }
}

// ─── Newsletter emails ─────────────────────────────────────────────────────────

const NEWSLETTER_NOTE = `You're receiving this because you subscribed to the ${BRAND} newsletter.`;

// Welcome email sent right after someone subscribes.
export function buildNewsletterWelcome({ unsubscribeUrl } = {}) {
  return {
    subject: `You're on the list — welcome to ${BRAND}`,
    html: renderEmail({
      preheader: 'First access to new collections, limited prints & members-only offers.',
      heading: 'Welcome to the inner circle',
      bodyHtml: `Thanks for subscribing! You'll be the first to hear about new collections, limited-edition prints, and members-only offers — no spam, ever.`,
      cta: { label: 'Explore new arrivals', url: `${clientUrl()}/shop` },
      footerNote: NEWSLETTER_NOTE,
      unsubscribeUrl,
    }),
  };
}

// Wrap an admin-composed campaign (subject + message + optional image/CTA) in the
// branded shell. `body` may contain simple HTML; plain newlines become <br/>.
export function buildNewsletterCampaign({ subject, heading, body, ctaLabel, ctaUrl, unsubscribeUrl, imageUrl }) {
  const htmlBody = String(body || '').includes('<')
    ? body
    : String(body || '').replace(/\n/g, '<br/>');
  return {
    subject,
    html: renderEmail({
      preheader: String(body || '').replace(/<[^>]+>/g, '').slice(0, 110),
      heading: heading || subject || BRAND,
      bodyHtml: htmlBody,
      cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
      imageUrl,
      footerNote: NEWSLETTER_NOTE,
      unsubscribeUrl,
    }),
  };
}
