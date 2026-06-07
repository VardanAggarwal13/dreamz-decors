import { useEffect, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import api from '@/lib/api';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { formatINR } from '@/lib/utils';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/customers').then((res) => setUsers(res.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (id, role) => {
    setUsers((list) => list.map((u) => (u._id === id ? { ...u, role } : u)));
    setViewing((v) => (v && v._id === id ? { ...v, role } : v));
    try {
      await api.patch(`/admin/customers/${id}/role`, { role });
      toast.success(`Role set to ${role}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
      load();
    }
  };

  return (
    <div>
      <Seo title="Admin — Customers" noIndex />
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Customers</h1>

      {/* Mobile / tablet: cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {users.map((u) => (
          <div key={u._id} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <button type="button" onClick={() => setViewing(u)} className="flex w-full items-center gap-3 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-bone">{initials(u.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{u.name}</span>
                <span className="block truncate text-xs text-ink-muted">{u.email}</span>
              </span>
            </button>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline/50 pt-3 text-center text-xs">
              <div><span className="block text-ink-muted">Orders</span><span className="font-medium text-ink">{u.orders}</span></div>
              <div><span className="block text-ink-muted">Spend</span><span className="font-medium text-ink">{formatINR(u.spend)}</span></div>
              <div><span className="block text-ink-muted">Joined</span><span className="font-medium text-ink">{fmtDate(u.createdAt)}</span></div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => changeRole(u._id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-bone-soft px-2 py-2 text-xs text-ink-soft outline-none focus:border-gold"
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
              <button onClick={() => setViewing(u)} className="shrink-0 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-ink-soft transition hover:text-ink" aria-label="View"><FiEye size={15} /></button>
            </div>
          </div>
        ))}
        {!loading && users.length === 0 && (
          <p className="col-span-full rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">No customers yet.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spend</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(u)} className="font-medium text-ink hover:text-gold-deep">{u.name}</button>
                </td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3 text-ink-soft">{u.orders}</td>
                <td className="px-4 py-3 text-ink">{formatINR(u.spend)}</td>
                <td className="px-4 py-3 text-ink-muted">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="rounded-lg border border-hairline bg-bone px-2 py-1.5 text-xs text-ink-soft outline-none focus:border-gold"
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(u)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={7} className="py-10 text-center text-ink-muted">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name}
        maxWidth="max-w-lg"
        subtitle={viewing && <span className="text-sm text-ink-soft">{viewing.email}</span>}
        footer={viewing && (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Role</span>
            <select
              value={viewing.role}
              onChange={(e) => changeRole(viewing._id, e.target.value)}
              className="rounded-lg border border-hairline bg-bone px-3 py-2 text-sm text-ink-soft outline-none focus:border-gold"
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
          </label>
        )}
      >
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-bone">{initials(viewing.name)}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{viewing.name}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${viewing.role === 'admin' ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'}`}>
                  {viewing.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ViewStat label="Orders" value={viewing.orders ?? 0} />
              <ViewStat label="Spend" value={formatINR(viewing.spend)} />
              <ViewStat label="Joined" value={fmtDate(viewing.createdAt)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
