import { useMemo, useState } from 'react';
import { admin } from '../api';
import { apiUrl } from '../../lib/config';
import { Download, Trash2 } from 'lucide-react';
import { Badge, ErrorNote, Loading, PageHeader, Panel, dateOnly, useLoad } from '../ui';
import { formatPrice } from '../../lib/format';

export default function Customers() {
  const { status, data, error } = useLoad(() => admin.customers());
  const [q, setQ] = useState('');
  const list = useMemo(
    () => (data?.customers || []).filter((c) => !q || `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  );
  return (
    <>
      <PageHeader title="Customers" text={data ? `${data.customers.length} registered accounts` : undefined} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone or city" className="field-box mb-5 py-2 text-[14px]" aria-label="Search customers" />
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data && (
        <div className="overflow-x-auto border border-line bg-white/60">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-beige/60">
              <tr>
                {['Name', 'Contact', 'City', 'Joined', 'Orders', 'Spent', 'Last order'].map((h) => (
                  <th key={h} className="label-caps px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3">
                    {c.name} {c.role === 'admin' && <Badge tone="ink">Admin</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${c.email}`} className="underline-offset-4 hover:underline">
                      {c.email}
                    </a>
                    {c.phone && <span className="block text-[11px] text-muted">{c.phone}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.city || '—'}</td>
                  <td className="px-4 py-3 text-muted">{dateOnly(c.createdAt)}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3">{formatPrice(c.spent)}</td>
                  <td className="px-4 py-3 text-muted">{c.lastOrder ? dateOnly(c.lastOrder) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-[13px] text-muted">No customers yet.</p>}
        </div>
      )}
      <Subscribers />
    </>
  );
}

function Subscribers() {
  const { status, data, error, setData } = useLoad(() => admin.subscribers());
  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.email} from the newsletter list?`)) return;
    await admin.deleteSubscriber(s._id);
    setData({ subscribers: data.subscribers.filter((x) => x._id !== s._id) });
  };
  return (
    <Panel
      className="mt-8"
      title={`Newsletter subscribers${data ? ` (${data.subscribers.length})` : ''}`}
      actions={
        <a href={apiUrl('/api/admin/subscribers.csv')} className="inline-flex items-center gap-2 text-[12px] underline underline-offset-4">
          <Download size={13} /> Export CSV
        </a>
      }
    >
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data?.subscribers.length === 0 && <p className="text-[13px] text-muted">No subscribers yet.</p>}
      <ul className="divide-y divide-line text-[14px]">
        {data?.subscribers.map((s) => (
          <li key={s._id} className="flex items-center justify-between gap-4 py-2">
            <span>{s.email}</span>
            <span className="flex items-center gap-3 text-[12px] text-muted">
              {dateOnly(s.createdAt)}
              <button type="button" onClick={() => remove(s)} className="p-1 hover:text-error" aria-label={`Remove ${s.email}`}>
                <Trash2 size={13} />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
