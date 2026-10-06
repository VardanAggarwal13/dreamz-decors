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

export function clientUrl(ctx = {}) {
  // 1. If explicit origin was provided in ctx (e.g. from req.headers.origin on live site)
  if (ctx.origin && typeof ctx.origin === 'string' && ctx.origin.startsWith('http')) {
    return ctx.origin.replace(/\/+$/, '');
  }

  // 2. If LIVE_SITE_URL or SITE_URL is defined
  const explicit = process.env.LIVE_SITE_URL || process.env.SITE_URL;
  if (explicit && typeof explicit === 'string' && explicit.startsWith('http')) {
    return explicit.replace(/\/+$/, '');
  }

  // 3. Check comma-separated CLIENT_URL in env
  const raw = process.env.CLIENT_URL || '';
  const origins = raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  // If in production or live origin is present in CLIENT_URL, prefer non-localhost URL!
  const live = origins.find((o) => !o.includes('localhost') && !o.includes('127.0.0.1'));
  if (live) return live;

  if (process.env.NODE_ENV === 'production') {
    return 'https://www.dreamdecords.com';
  }

  return origins[0] || 'http://localhost:5173';
}

const supportEmail = () => process.env.SUPPORT_EMAIL || 'dreamzdecor30@gmail.com';
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
 * @param {object} [ctx]            Context object carrying origin or clientUrl
 */
function renderEmail({ preheader, heading, bodyHtml, cta, imageUrl, footerNote, unsubscribeUrl }, ctx = {}) {
  const baseUrl = clientUrl(ctx);
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
            © ${currentYear()} ${BRAND} · <a href="${baseUrl}" style="color:${COLORS.muted};text-decoration:underline;">dreamzdecors.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Transactional emails (orders, account) ────────────────────────────────────

function unboxingNoticeHtml() {
  return `<div style="margin:24px 0 10px;padding:16px 18px;background-color:${COLORS.bone};border-left:3px solid ${COLORS.gold};border-radius:8px;font-size:13px;line-height:1.65;color:${COLORS.inkSoft};">
    <strong style="color:${COLORS.ink};display:block;margin-bottom:6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
      📦 Important: Transit Protection & Unboxing Policy
    </strong>
    Every shipment is fully insured under our <strong>100% Free Doorstep Replacement Guarantee</strong>. In the rare event of transit damage or defect, an <strong>uncut, continuous parcel unboxing video</strong> (recorded from opening the sealed courier box to inspecting the artwork) is <strong>strictly mandatory</strong> for replacement approval. Please notify us within <strong>48 hours of delivery</strong> via WhatsApp (+91 82848 65051) or email <a href="mailto:${supportEmail()}" style="color:${COLORS.goldDeep};text-decoration:underline;">${supportEmail()}</a> with your video for an immediate free replacement.
  </div>`;
}

function unboxingNoticeText() {
  return `\n\n[IMPORTANT: TRANSIT PROTECTION & UNBOXING POLICY]\nEvery shipment is fully insured under our 100% Free Doorstep Replacement Guarantee. In the rare event of transit damage or defect, an uncut, continuous parcel unboxing video (recorded from opening the sealed courier box to inspecting the artwork) is strictly mandatory for replacement approval. Please notify us within 48 hours of delivery via WhatsApp (+91 82848 65051) or email ${supportEmail()} with your video for an immediate free replacement dispatch.`;
}

// Map a notification type to a branded email. `ctx` carries { name, order, origin, … }.
export function buildEmail(type, ctx = {}) {
  const baseUrl = clientUrl(ctx);
  const name = ctx.name || ctx.order?.shippingAddress?.name || 'there';
  const orderId = ctx.order?._id || ctx.orderId;
  const orderUrl = orderId ? `${baseUrl}/account/orders/${orderId}` : `${baseUrl}/account/orders`;
  const total = ctx.order?.total != null ? `₹${Number(ctx.order.total).toLocaleString('en-IN')}` : null;
  const viewOrder = { label: 'View order', url: orderUrl };

  switch (type) {
    case 'order_placed':
      return {
        subject: `Order confirmed — thank you, ${name}!`,
        text: `Hi ${name}, we've received your order${total ? ` of ${total}` : ''}. We'll start preparing it and notify you the moment it ships.${unboxingNoticeText()}\n\nView order: ${orderUrl}`,
        html: renderEmail({
          preheader: `We've received your order${total ? ` of ${total}` : ''}.`,
          heading: 'Your order is confirmed',
          bodyHtml: `<p style="margin:0 0 12px;">Hi ${name}, we've received your order${total ? ` of <strong>${total}</strong>` : ''}. We'll start preparing it and notify you the moment it ships.</p>${unboxingNoticeHtml()}`,
          cta: viewOrder,
        }, ctx),
      };
    case 'order_paid':
      return {
        subject: `Order confirmed — thank you, ${name}! (${orderId ? `#${orderId}` : ''})`.trim(),
        text: `Hi ${name}, thank you for your order! Your payment${total ? ` of ${total}` : ''} was successful. Our studio has received your order and our artisans are now hand-finishing, framing, and carefully packaging your artwork. We'll send you tracking details as soon as it ships.${unboxingNoticeText()}\n\nView order: ${orderUrl}`,
        html: renderEmail({
          preheader: `Your payment${total ? ` of ${total}` : ''} was successful and your order is confirmed.`,
          heading: 'Order Confirmed & In Production',
          bodyHtml: `<p style="margin:0 0 12px;">Hi ${name}, thank you for your order! Your payment${total ? ` of <strong>${total}</strong>` : ''} was successful. Our studio has received your order and our artisans are now hand-finishing, framing, and carefully packaging your artwork. We'll send you tracking details as soon as it ships.</p>${unboxingNoticeHtml()}`,
          cta: viewOrder,
        }, ctx),
      };
    case 'order_processing':
      return {
        subject: `Your order is being prepared 🎨`,
        text: `Hi ${name}, our studio has begun preparing your order${total ? ` of ${total}` : ''}. Each piece is carefully inspected, framed, and packaged with archival care. We'll notify you the moment it ships.${unboxingNoticeText()}\n\nView order: ${orderUrl}`,
        html: renderEmail({
          preheader: `We're preparing your order${total ? ` of ${total}` : ''} for dispatch.`,
          heading: 'Order in preparation',
          bodyHtml: `<p style="margin:0 0 12px;">Hi ${name}, our studio has begun preparing your order${total ? ` of <strong>${total}</strong>` : ''}. Each piece is carefully inspected, framed, and packaged with archival care. We'll notify you the moment it ships.</p>${unboxingNoticeHtml()}`,
          cta: viewOrder,
        }, ctx),
      };
    case 'order_shipped':
      return {
        subject: 'Your order has shipped 🚚',
        text: `Good news, ${name}! Your order has been dispatched and is on its way. Tracking details will follow shortly.${unboxingNoticeText()}\n\nTrack order: ${orderUrl}`,
        html: renderEmail({
          preheader: 'Your order is on its way.',
          heading: 'On its way to you',
          bodyHtml: `<p style="margin:0 0 12px;">Good news, ${name}! Your order has been dispatched and is on its way. Tracking details will follow shortly.</p>${unboxingNoticeHtml()}`,
          cta: { label: 'Track order', url: orderUrl },
        }, ctx),
      };
    case 'order_delivered':
      return {
        subject: 'Your order has been delivered',
        text: `Hi ${name}, your order has been delivered. We hope you love your new artwork! Please remember to inspect your package upon arrival.${unboxingNoticeText()}\n\nView order: ${orderUrl}`,
        html: renderEmail({
          preheader: 'We hope you love it!',
          heading: 'Delivered',
          bodyHtml: `<p style="margin:0 0 12px;">Hi ${name}, your order has been delivered. We hope you love your new artwork! Please remember to inspect your package upon arrival.</p>${unboxingNoticeHtml()}<p style="margin:16px 0 0;">If everything looks perfect, tap below to view your order and leave a review.</p>`,
          cta: viewOrder,
        }, ctx),
      };
    case 'order_cancelled':
      return {
        subject: 'Your order was cancelled',
        html: renderEmail({
          preheader: 'Your order has been cancelled.',
          heading: 'Order cancelled',
          bodyHtml: `Hi ${name}, your order has been cancelled. If this wasn't expected or you need a refund update, reply to this email.`,
          cta: viewOrder,
        }, ctx),
      };
    case 'order_refunded':
      return {
        subject: 'Refund processed',
        html: renderEmail({
          preheader: `Your refund${total ? ` of ${total}` : ''} has been processed.`,
          heading: 'Refund processed',
          bodyHtml: `Hi ${name}, your refund${total ? ` of <strong>${total}</strong>` : ''} has been processed and should reflect in your account soon.`,
          cta: viewOrder,
        }, ctx),
      };
    case 'account_welcome':
      return {
        subject: `Welcome to ${BRAND}`,
        html: renderEmail({
          preheader: 'Hand-finished canvases, gallery sets and statement pieces await.',
          heading: `Welcome, ${name}!`,
          bodyHtml: `Thanks for joining ${BRAND}. Explore hand-finished canvases, gallery sets, and statement pieces curated for spaces that linger.`,
          cta: { label: 'Start shopping', url: `${baseUrl}/shop` },
        }, ctx),
      };
    case 'admin_new_order':
      return {
        subject: `New order received${total ? ` — ${total}` : ''}`,
        html: renderEmail({
          preheader: `A new order was placed${total ? ` for ${total}` : ''}.`,
          heading: 'New order received',
          bodyHtml: `A new order has been placed${ctx.customerName ? ` by <strong>${ctx.customerName}</strong>` : ''}${total ? ` for <strong>${total}</strong>` : ''}. Open the dashboard to review and process it.`,
          cta: { label: 'Open admin orders', url: `${baseUrl}/admin/orders` },
        }, ctx),
      };
    case 'admin_order_paid':
      return {
        subject: `Payment received${total ? ` — ${total}` : ''}`,
        html: renderEmail({
          preheader: `Payment confirmed${total ? ` of ${total}` : ''}.`,
          heading: 'Payment received',
          bodyHtml: `Payment has been confirmed${ctx.customerName ? ` from <strong>${ctx.customerName}</strong>` : ''}${total ? ` for <strong>${total}</strong>` : ''}. The order is ready to be processed and shipped.`,
          cta: { label: 'Open admin orders', url: `${baseUrl}/admin/orders` },
        }, ctx),
      };
    default:
      return {
        subject: ctx.title || `Update from ${BRAND}`,
        html: renderEmail({
          preheader: ctx.message || '',
          heading: ctx.title || 'Notification',
          bodyHtml: ctx.message || '',
          cta: ctx.link ? { label: 'View', url: `${baseUrl}${ctx.link.startsWith('/') ? '' : '/'}${ctx.link}` } : undefined,
        }, ctx),
      };
  }
}

// ─── Contact form ──────────────────────────────────────────────────────────────

// Escape user-supplied text before embedding it in HTML email.
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Notifies the store of a customer contact-form submission. The customer's
// email is set as reply-to (by the controller) so the admin can reply directly.
export function buildContactMessage({ name, email, subject, message }, ctx = {}) {
  const safeSubject = subject?.trim() || 'New enquiry';
  const rows = [
    ['Name', name],
    ['Email', email],
    ['Subject', safeSubject],
  ]
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:6px 0;font-size:13px;color:${COLORS.muted};width:90px;vertical-align:top;">${label}</td>
          <td style="padding:6px 0;font-size:14px;color:${COLORS.ink};font-weight:600;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:18px;">
      ${rows}
    </table>
    <div style="padding:16px 18px;background:${COLORS.bone};border:1px solid ${COLORS.line};border-radius:12px;
                font-size:14px;line-height:1.7;color:${COLORS.ink};white-space:pre-line;">${escapeHtml(message)}</div>`;

  return {
    subject: `Contact form: ${safeSubject}`,
    html: renderEmail({
      preheader: `New message from ${name} (${email})`,
      heading: 'New contact message',
      bodyHtml,
      cta: { label: 'Reply by email', url: `mailto:${email}?subject=${encodeURIComponent('Re: ' + safeSubject)}` },
      footerNote: `Sent from the ${BRAND} website contact form. Reply directly to respond to the customer.`,
    }, ctx),
  };
}

// ─── Newsletter emails ─────────────────────────────────────────────────────────

const NEWSLETTER_NOTE = `You're receiving this because you subscribed to the ${BRAND} newsletter.`;

// Welcome email sent right after someone subscribes.
export function buildNewsletterWelcome({ unsubscribeUrl } = {}, ctx = {}) {
  const baseUrl = clientUrl(ctx);
  return {
    subject: `You're on the list — welcome to ${BRAND}`,
    html: renderEmail({
      preheader: 'First access to new collections, limited prints & members-only offers.',
      heading: 'Welcome to the inner circle',
      bodyHtml: `Thanks for subscribing! You'll be the first to hear about new collections, limited-edition prints, and members-only offers — no spam, ever.`,
      cta: { label: 'Explore new arrivals', url: `${baseUrl}/shop` },
      footerNote: NEWSLETTER_NOTE,
      unsubscribeUrl,
    }, ctx),
  };
}

// Wrap an admin-composed campaign (subject + message + optional image/CTA) in the
// branded shell. `body` may contain simple HTML; plain newlines become <br/>.
export function buildNewsletterCampaign({ subject, heading, body, ctaLabel, ctaUrl, unsubscribeUrl, imageUrl }, ctx = {}) {
  const baseUrl = clientUrl(ctx);
  const htmlBody = String(body || '').includes('<')
    ? body
    : String(body || '').replace(/\n/g, '<br/>');
  const safeCtaUrl = ctaUrl
    ? (ctaUrl.startsWith('http') ? ctaUrl : `${baseUrl}${ctaUrl.startsWith('/') ? '' : '/'}${ctaUrl}`)
    : undefined;
  return {
    subject,
    html: renderEmail({
      preheader: String(body || '').replace(/<[^>]+>/g, '').slice(0, 110),
      heading: heading || subject || BRAND,
      bodyHtml: htmlBody,
      cta: ctaLabel && safeCtaUrl ? { label: ctaLabel, url: safeCtaUrl } : undefined,
      imageUrl,
      footerNote: NEWSLETTER_NOTE,
      unsubscribeUrl,
    }, ctx),
  };
}
