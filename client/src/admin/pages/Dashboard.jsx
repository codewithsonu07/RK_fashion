import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { admin } from '../api';
import { apiUrl } from '../../lib/config';
import { Badge, ErrorNote, Loading, PageHeader, Panel, useLoad } from '../ui';
import { formatPrice } from '../../lib/format';

const STATUS_LABELS = { pending_payment: 'Awaiting payment', placed: 'Placed', processing: 'In atelier', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { status, data, error } = useLoad(() => admin.stats(days), [days]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        text="Sales, orders and studio activity at a glance."
        actions={
          <>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="field-box w-auto py-2 text-[13px]" aria-label="Report period">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 12 months</option>
            </select>
            <a href={apiUrl('/api/admin/orders.csv')} className="inline-flex items-center gap-2 border border-ink/70 px-4 py-2 text-[11px] uppercase tracking-[0.16em] hover:bg-ink hover:text-ivory">
              <Download size={14} /> Orders CSV
            </a>
          </>
        }
      />
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat label="Revenue (all time)" value={formatPrice(data.revenue)} />
            <Stat label="Confirmed orders" value={data.orders} />
            <Stat label="Average order" value={formatPrice(data.averageOrder)} />
            <Stat label="Customers" value={data.customers} />
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat label="New bespoke enquiries" value={data.newEnquiries} to="/admin/enquiries" highlight={data.newEnquiries > 0} />
            <Stat label="Appointments to confirm" value={data.pendingAppointments} to="/admin/appointments" highlight={data.pendingAppointments > 0} />
            <Stat label="Orders to prepare" value={(data.byStatus.placed || 0) + (data.byStatus.processing || 0)} to="/admin/orders" highlight={(data.byStatus.placed || 0) > 0} />
            <Stat label="Low-stock products" value={data.lowStock.length} to="/admin/products" highlight={data.lowStock.length > 0} />
          </div>

          <Panel title={`Revenue — last ${data.days} days`}>
            <RevenueChart byDay={data.byDay} days={data.days} />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Best-selling products">
              {data.topProducts.length === 0 ? (
                <p className="text-[13px] text-muted">No sales yet.</p>
              ) : (
                <ol className="space-y-3 text-[14px]">
                  {data.topProducts.map((p, i) => (
                    <li key={p._id} className="flex items-baseline justify-between gap-3">
                      <span>
                        <span className="mr-2 text-muted">{i + 1}.</span>
                        {p.name}
                        <span className="ml-2 text-[12px] text-muted">× {p.units}</span>
                      </span>
                      <span className="shrink-0">{formatPrice(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
            <Panel title="Orders by status">
              <ul className="space-y-2.5 text-[14px]">
                {Object.entries(STATUS_LABELS).map(([k, label]) => (
                  <li key={k} className="flex justify-between">
                    <span>{label}</span>
                    <span className="text-muted">{data.byStatus[k] || 0}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-line pt-4 text-[13px]">
                <p className="label-caps mb-2 text-muted">Revenue split</p>
                <p>Women: {formatPrice(data.byGender.women || 0)}</p>
                <p>Men: {formatPrice(data.byGender.men || 0)}</p>
              </div>
            </Panel>
            <Panel title="Low stock (2 or fewer)">
              {data.lowStock.length === 0 ? (
                <p className="text-[13px] text-muted">All products are well stocked.</p>
              ) : (
                <ul className="space-y-2.5 text-[14px]">
                  {data.lowStock.map((p) => (
                    <li key={p.slug} className="flex justify-between gap-3">
                      <Link to={`/admin/products/${p._id}`} className="hover:text-gold-dark">
                        {p.name}
                      </Link>
                      <Badge tone={p.stock === 0 ? 'red' : 'gold'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, to, highlight }) {
  const body = (
    <>
      <p className="label-caps text-muted">{label}</p>
      <p className={`mt-3 font-serif text-[32px] leading-none ${highlight ? 'text-gold-dark' : ''}`}>{value}</p>
    </>
  );
  return to ? (
    <Link to={to} className="border border-line bg-white/60 p-5 transition-colors hover:border-ink">
      {body}
    </Link>
  ) : (
    <div className="border border-line bg-white/60 p-5">{body}</div>
  );
}

function RevenueChart({ byDay, days }) {
  // Fill every day in the period so gaps show as zero.
  const map = new Map(byDay.map((d) => [d._id, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    return { key, revenue: map.get(key)?.revenue || 0, orders: map.get(key)?.orders || 0 };
  });
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const total = series.reduce((n, s) => n + s.revenue, 0);
  const W = 720;
  const H = 180;
  const bw = W / series.length;

  return (
    <div>
      <p className="mb-4 text-[14px]">
        <span className="font-serif text-2xl">{formatPrice(total)}</span>
        <span className="ml-2 text-muted">from {series.reduce((n, s) => n + s.orders, 0)} orders</span>
      </p>
      {total === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted">No confirmed orders in this period.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-auto w-full" role="img" aria-label="Daily revenue chart">
          <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line)" />
          {series.map((s, i) => {
            const h = (s.revenue / max) * (H - 10);
            return (
              <rect key={s.key} x={i * bw + bw * 0.15} y={H - h} width={bw * 0.7} height={h} fill="var(--color-champagne)">
                <title>
                  {s.key}: {formatPrice(s.revenue)} ({s.orders} orders)
                </title>
              </rect>
            );
          })}
          <text x="0" y={H + 15} fontSize="11" fill="var(--color-muted)">
            {series[0].key}
          </text>
          <text x={W} y={H + 15} fontSize="11" fill="var(--color-muted)" textAnchor="end">
            {series.at(-1).key}
          </text>
        </svg>
      )}
    </div>
  );
}
