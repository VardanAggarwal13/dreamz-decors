import { useEffect, useState } from 'react';
import { FiEye, FiTrash2, FiSend, FiSearch, FiMail } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import api from '@/lib/api';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import ImageInput from '@/components/admin/ImageInput';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
      status === 'subscribed' ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'
    }`}
  >
    {status}
  </span>
);

const emptyCampaign = { subject: '', heading: '', body: '', ctaLabel: '', ctaUrl: '', imageUrl: '' };

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [stats, setStats] = useState({ subscribed: 0, unsubscribed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [viewing, setViewing] = useState(null);
  const [composing, setComposing] = useState(false);
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (q.trim()) params.set('q', q.trim());
    if (statusFilter) params.set('status', statusFilter);
    api
      .get(`/admin/newsletter?${params.toString()}`)
      .then((res) => {
        setSubs(res.data || []);
        if (res.stats) setStats(res.stats);
      })
      .catch((err) => toast.error(err.message || 'Could not load subscribers'))
      .finally(() => setLoading(false));
  };

  // Re-fetch on filter changes (debounced for the search box).
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter]);

  const remove = async (id) => {
    if (!window.confirm('Remove this subscriber permanently?')) return;
    try {
      await api.delete(`/admin/newsletter/${id}`);
      setSubs((list) => list.filter((s) => s._id !== id));
      setViewing(null);
      toast.success('Subscriber removed');
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const send = async () => {
    if (!campaign.subject.trim() || !campaign.body.trim()) {
      toast.error('Subject and message are both required.');
      return;
    }
    if (!window.confirm(`Send this email to all ${stats.subscribed} subscribed recipient(s)?`)) return;
    setSending(true);
    try {
      const res = await api.post('/admin/newsletter/send', {
        subject: campaign.subject.trim(),
        heading: campaign.heading.trim() || undefined,
        body: campaign.body,
        ctaLabel: campaign.ctaLabel.trim() || undefined,
        ctaUrl: campaign.ctaUrl.trim() || undefined,
        imageUrl: campaign.imageUrl.trim() || undefined,
      });
      toast.success(res.message || 'Campaign sent');
      setComposing(false);
      setCampaign(emptyCampaign);
    } catch (err) {
      toast.error(err.message || 'Could not send campaign');
    } finally {
      setSending(false);
    }
  };

  const set = (k) => (e) => setCampaign((c) => ({ ...c, [k]: e.target.value }));

  // Live preview — ask the backend to render the EXACT email HTML subscribers
  // will receive, debounced so it updates smoothly as the admin types.
  useEffect(() => {
    if (!composing) return undefined;
    const t = setTimeout(() => {
      api
        .post('/admin/newsletter/preview', {
          subject: campaign.subject,
          heading: campaign.heading,
          body: campaign.body,
          ctaLabel: campaign.ctaLabel,
          ctaUrl: campaign.ctaUrl,
          imageUrl: campaign.imageUrl,
        })
        .then((res) => setPreviewHtml(res.data?.html || ''))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [composing, campaign]);

  return (
    <div>
      <Seo title="Admin — Newsletter" noIndex />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Newsletter</h1>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gold-deep px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold"
        >
          <FiSend size={14} /> Send campaign
        </button>
      </div>

      {/* Stats — compact tiles that keep their labels readable even at 320px */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Subscribed', value: stats.subscribed },
          { label: 'Unsubscribed', value: stats.unsubscribed },
          { label: 'Total', value: stats.total },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-hairline/60 bg-bone px-2 py-2.5 sm:px-3">
            <span className="block text-[9px] font-medium uppercase leading-tight tracking-normal text-ink-muted sm:text-[10px] sm:tracking-[0.16em]">
              {s.label}
            </span>
            <span className="mt-1 block text-base font-semibold text-ink sm:text-sm">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email…"
            className="w-full rounded-lg border border-hairline bg-bone py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-gold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-hairline bg-bone px-3 py-2.5 text-sm text-ink-soft outline-none focus:border-gold"
        >
          <option value="">All statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      {loading ? <AdminListSkeleton cols={5} withAvatar={false} /> : (<>
      {/* Mobile / tablet: cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {subs.map((s) => (
          <div key={s._id} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => setViewing(s)} className="min-w-0 break-all text-left font-medium text-ink hover:text-gold-deep">{s.email}</button>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/50 pt-3">
              <span className="text-xs capitalize text-ink-muted">{s.source || '—'} · {fmtDate(s.createdAt)}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setViewing(s)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                <button onClick={() => remove(s._id)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && subs.length === 0 && (
          <p className="col-span-full rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">No subscribers found.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Actions</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewing(s)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                    <button onClick={() => remove(s._id)} className="text-ink-soft hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(s)} className="font-medium text-ink hover:text-gold-deep">
                    {s.email}
                  </button>
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-ink-muted capitalize">{s.source || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{fmtDate(s.createdAt)}</td>
              </tr>
            ))}
            {!loading && subs.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-ink-muted">No subscribers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>)}

      {/* View subscriber modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.email}
        maxWidth="max-w-lg"
        subtitle={viewing && <StatusBadge status={viewing.status} />}
        footer={viewing && (
          <button
            type="button"
            onClick={() => remove(viewing._id)}
            className="inline-flex items-center gap-2 rounded-lg border border-sale/40 px-4 py-2 text-sm font-medium text-sale transition hover:bg-sale/10"
          >
            <FiTrash2 size={14} /> Remove subscriber
          </button>
        )}
      >
        {viewing && (
          <div className="grid grid-cols-2 gap-4">
            <ViewStat label="Source" value={viewing.source || '—'} />
            <ViewStat label="Status" value={viewing.status} />
            <ViewStat label="Subscribed" value={fmtDate(viewing.subscribedAt || viewing.createdAt)} />
            <ViewStat label="Unsubscribed" value={viewing.unsubscribedAt ? fmtDate(viewing.unsubscribedAt) : '—'} />
          </div>
        )}
      </Modal>

      {/* Compose campaign modal — form + live email preview side by side */}
      <Modal
        open={composing}
        onClose={() => !sending && setComposing(false)}
        title="Send a campaign"
        fullScreen
        bodyClassName="flex-1 overflow-y-auto lg:overflow-hidden"
        subtitle={<span className="text-sm text-ink-soft">Delivered to {stats.subscribed} subscribed recipient(s), each with an unsubscribe link.</span>}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => !sending && setComposing(false)} className="rounded-lg border border-hairline bg-bone px-4 py-2 text-sm text-ink-soft transition hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={sending || stats.subscribed === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-deep px-5 py-2 text-sm font-semibold text-bone transition hover:bg-gold disabled:opacity-60"
            >
              <FiSend size={14} /> {sending ? 'Sending…' : 'Send now'}
            </button>
          </div>
        }
      >
        <div className="grid gap-6 p-5 sm:p-6 lg:h-full lg:grid-cols-2 lg:gap-8">
          {/* Form — scrolls on its own on desktop */}
          <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <Field label="Subject" required>
              <input value={campaign.subject} onChange={set('subject')} placeholder="New arrivals just dropped ✦" className={inputCls} />
            </Field>
            <Field label="Heading" hint="Big title inside the email. Defaults to the subject.">
              <input value={campaign.heading} onChange={set('heading')} placeholder="Fresh on the wall" className={inputCls} />
            </Field>

            {/* Banner image — upload a file or paste a link */}
            <ImageInput
              label="Banner image"
              value={campaign.imageUrl}
              onChange={(url) => setCampaign((c) => ({ ...c, imageUrl: url }))}
              hint="Shown full-width at the top of the email."
            />

            <Field label="Message" required hint="Plain text or simple HTML. Line breaks are preserved.">
              <textarea value={campaign.body} onChange={set('body')} rows={6} placeholder="Write your update to subscribers…" className={`${inputCls} resize-y`} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Button label" hint="Optional call-to-action.">
                <input value={campaign.ctaLabel} onChange={set('ctaLabel')} placeholder="Shop the drop" className={inputCls} />
              </Field>
              <Field label="Button link">
                <input value={campaign.ctaUrl} onChange={set('ctaUrl')} placeholder="https://…" className={inputCls} />
              </Field>
            </div>
            <p className="flex items-start gap-2 rounded-xl border border-hairline/60 bg-bone-soft px-4 py-3 text-xs leading-5 text-ink-muted">
              <FiMail size={14} className="mt-0.5 shrink-0" />
              Emails send from your configured mail account. On a free SMTP plan, keep sends modest to avoid daily limits.
            </p>
          </div>

          {/* Live preview — fills the column height */}
          <div className="flex min-h-0 flex-col">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
              <FiEye size={13} /> Live preview
            </span>
            <div className="min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-hairline/60 bg-[#f7f3ec] lg:min-h-0">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="h-full w-full border-0 bg-[#f7f3ec]"
                sandbox=""
              />
            </div>
            <p className="mt-2 shrink-0 text-center text-[11px] text-ink-muted">Exactly what subscribers receive.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-hairline bg-bone-soft px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition focus:border-gold';

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
        {label} {required && <span className="text-sale">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
