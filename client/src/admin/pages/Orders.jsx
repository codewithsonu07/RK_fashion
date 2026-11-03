import { useMemo, useState } from 'react';
import { admin } from '../api';
import { Badge, Btn, Drawer, ErrorNote, Input, Loading, PageHeader, dateTime, useLoad } from '../ui';
import { OrderItems, OrderTimeline, paymentLabel } from '../../components/OrderStatus';
import { formatPrice } from '../../lib/format';

export const ORDER_STATUS = {
  pending_payment: { label: 'Awaiting payment', tone: 'grey' },
  placed: { label: 'Placed', tone: 'gold' },
  processing: { label: 'In atelier', tone: 'gold' },
  shipped: { label: 'Shipped', tone: 'ink' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

export default function Orders() {
  const { status, data, error, setData } = useLoad(() => admin.orders());
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [openNumber, setOpenNumber] = useState(null);

  const orders = useMemo(
    () =>
      (data?.orders || []).filter(
        (o) => (!filter || o.status === filter) && (!q || `${o.orderNumber} ${o.email} ${o.shippingAddress?.fullName}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, filter, q],
  );
  const open = data?.orders.find((o) => o.orderNumber === openNumber);

  const replace = (order) => setData({ orders: data.orders.map((o) => (o.orderNumber === order.orderNumber ? { ...o, ...order } : o)) });

  return (
    <>
      <PageHeader title="Orders" text="Update order status and courier tracking. Customers see changes immediately on their order page." />
      <div className="mb-5 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order number, email or name" className="field-box flex-1 py-2 text-[14px]" aria-label="Search orders" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field-box w-auto py-2 text-[13px]" aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data && (
        <div className="overflow-x-auto border border-line bg-white/60">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-line bg-beige/60">
              <tr>
                {['Order', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status'].map((h) => (
                  <th key={h} className="label-caps px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.orderNumber} className="cursor-pointer hover:bg-beige/40" onClick={() => setOpenNumber(o.orderNumber)}>
                  <td className="px-4 py-3 font-medium">
                    <button type="button" className="underline-offset-4 hover:underline">
                      {o.orderNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    {o.shippingAddress?.fullName}
                    <span className="block text-[11px] text-muted">{o.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className="px-4 py-3">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-muted">{paymentLabel(o.payment)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="p-8 text-center text-[13px] text-muted">No orders yet.</p>}
        </div>
      )}
      <Drawer open={!!open} onClose={() => setOpenNumber(null)} title={open?.orderNumber || ''} width="max-w-2xl">
        {open && <OrderPanel order={open} onSaved={replace} />}
      </Drawer>
    </>
  );
}

const NEXT = { placed: 'processing', processing: 'shipped', shipped: 'delivered' };

function OrderPanel({ order, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState({ carrier: order.tracking?.carrier || '', number: order.tracking?.number || '', url: order.tracking?.url || '' });
  const [state, setState] = useState({ status: 'idle', error: null, msg: '' });
  const a = order.shippingAddress || {};

  const save = async () => {
    setState({ status: 'saving', error: null, msg: '' });
    try {
      const body = { tracking };
      if (status !== order.status || note) {
        body.status = status;
        if (note) body.note = note;
      }
      const { order: updated } = await admin.updateOrder(order.orderNumber, body);
      onSaved(updated);
      setNote('');
      setState({ status: 'idle', error: null, msg: 'Order updated.' });
    } catch (error) {
      setState({ status: 'idle', error, msg: '' });
    }
  };

  return (
    <div className="space-y-8 text-[14px]">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="label-caps text-muted">Customer</p>
          <p className="mt-2">{a.fullName}</p>
          <p className="text-muted">{order.email}</p>
          <p className="text-muted">{a.phone}</p>
        </div>
        <div>
          <p className="label-caps text-muted">Ship to</p>
          <p className="mt-2 leading-relaxed">
            {a.line1}
            {a.line2 && `, ${a.line2}`}
            <br />
            {a.city}, {a.state} {a.pincode}
          </p>
        </div>
        <div>
          <p className="label-caps text-muted">Payment</p>
          <p className="mt-2">{paymentLabel(order.payment)}</p>
        </div>
        <div>
          <p className="label-caps text-muted">Placed</p>
          <p className="mt-2">{dateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-4 border border-line bg-white/60 p-5">
        <p className="label-caps">Update order</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Status" as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Input>
          <Input label="Note for the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Final pressing complete" />
          <Input label="Courier" value={tracking.carrier} onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })} placeholder="Blue Dart, Delhivery…" />
          <Input label="Tracking number" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} />
          <Input label="Tracking link (optional)" value={tracking.url} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} className="sm:col-span-2" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={save} disabled={state.status === 'saving'}>
            {state.status === 'saving' ? 'Saving…' : 'Save'}
          </Btn>
          {NEXT[order.status] && status === order.status && (
            <Btn variant="outline" onClick={() => setStatus(NEXT[order.status])}>
              Mark as {ORDER_STATUS[NEXT[order.status]].label}
            </Btn>
          )}
          {state.msg && <span className="text-[13px] text-gold-dark">{state.msg}</span>}
        </div>
        <ErrorNote error={state.error} />
      </div>

      <div>
        <p className="label-caps mb-2 text-muted">Items</p>
        <OrderItems order={order} linkItems={false} />
      </div>
      <div>
        <p className="label-caps mb-3 text-muted">Timeline</p>
        <OrderTimeline order={order} />
      </div>
    </div>
  );
}
