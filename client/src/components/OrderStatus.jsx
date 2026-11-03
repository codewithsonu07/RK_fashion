import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { img } from '../lib/image';

const STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'processing', label: 'In the Atelier' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const dateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const paymentLabel = (payment) =>
  payment.method === 'cod'
    ? payment.status === 'paid'
      ? 'Cash on delivery · Paid'
      : 'Cash on delivery · Pay on delivery'
    : { paid: 'Paid online', pending: 'Awaiting online payment', failed: 'Payment failed', refunded: 'Refunded' }[payment.status] || payment.status;

export function OrderProgress({ order }) {
  if (order.status === 'cancelled')
    return <p className="border border-error/40 bg-error/5 p-4 text-[14px] text-error">This order has been cancelled.</p>;
  if (order.status === 'pending_payment')
    return <p className="border border-champagne bg-cream p-4 text-[14px]">This order is awaiting payment and has not been confirmed yet.</p>;
  const current = STEPS.findIndex((s) => s.key === order.status);
  return (
    <ol className="grid grid-cols-4" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-4 h-px w-full ${i <= current ? 'bg-ink' : 'bg-sand'}`} aria-hidden />}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${done ? 'border-ink bg-ink text-ivory' : 'border-sand bg-ivory text-muted'}`}>
              {done ? <Check size={14} strokeWidth={1.5} /> : i + 1}
            </span>
            <span className={`mt-3 text-[10px] uppercase tracking-[0.14em] ${i === current ? 'text-ink' : 'text-muted'}`} aria-current={i === current ? 'step' : undefined}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTimeline({ order }) {
  return (
    <ol className="space-y-4 border-l border-sand pl-6">
      {[...order.timeline].reverse().map((e, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-champagne' : 'bg-sand'}`} />
          <p className="text-[14px]">{e.note}</p>
          <p className="text-[12px] text-muted">{dateTime(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}

export function OrderItems({ order, linkItems = true }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((i) => (
          <li key={`${i.slug}-${i.size}-${i.colour}`} className="flex gap-4 py-4">
            <img src={img(i.image, 120, 160)} alt="" className="h-20 w-15 shrink-0 object-cover" />
            <div className="flex-1">
              {linkItems ? (
                <Link to={`/product/${i.slug}`} className="font-serif text-lg leading-tight hover:text-gold-dark">
                  {i.name}
                </Link>
              ) : (
                <p className="font-serif text-lg leading-tight">{i.name}</p>
              )}
              <p className="mt-1 text-[12px] text-muted">
                Size {i.size}
                {i.colour && ` · ${i.colour}`} · Qty {i.qty}
              </p>
            </div>
            <p className="text-[14px]">{formatPrice(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{order.shippingFee ? formatPrice(order.shippingFee) : 'Complimentary'}</dd>
        </div>
        <div className="flex justify-between pt-2 font-serif text-2xl">
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export const orderDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
