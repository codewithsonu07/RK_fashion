import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { OrderItems, OrderProgress, OrderTimeline, orderDate, paymentLabel } from '../../components/OrderStatus';
import { useAuth } from '../../store/auth';
import { useShop } from '../../store/shop';
import { api } from '../../lib/api';
import { payWithRazorpay } from '../../lib/razorpay';
import { usePageTitle } from '../../lib/usePageTitle';

export default function OrderDetail() {
  const { number } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { clearBag } = useShop();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });
  const [pay, setPay] = useState({ status: 'idle', error: '' });
  usePageTitle(`Order ${number}`);

  const load = useCallback(() => {
    api
      .myOrder(number)
      .then(({ order }) => setState({ status: 'ready', order, error: null }))
      .catch((error) => setState({ status: 'error', order: null, error }));
  }, [number]);
  useEffect(load, [load]);

  const completePayment = async () => {
    setPay({ status: 'loading', error: '' });
    try {
      const res = await api.retryPayment(number);
      const payment = await payWithRazorpay({ razorpay: res.razorpay, order: res.order, customer: { name: user.name, email: user.email, phone: user.phone } });
      if (!payment) return setPay({ status: 'idle', error: '' });
      await api.verifyPayment(number, payment);
      clearBag();
      setPay({ status: 'idle', error: '' });
      load();
    } catch (err) {
      setPay({ status: 'error', error: err.message });
    }
  };

  if (state.status === 'loading') return <div className="container-luxe min-h-[60vh] py-16"><div className="h-40 animate-pulse bg-beige" /></div>;
  if (state.status === 'error')
    return (
      <section className="container-luxe min-h-[60vh] py-16 text-center">
        <p className="font-serif text-3xl">{state.error.message}</p>
        <Link to="/account?tab=orders" className="btn-outline mt-8">
          View My Orders
        </Link>
      </section>
    );

  const { order } = state;
  const justPlaced = params.get('placed') === '1' && order.status !== 'pending_payment';
  const a = order.shippingAddress;

  return (
    <section className="container-luxe py-12 sm:py-16">
      <Breadcrumbs items={[{ label: 'My Account', to: '/account' }, { label: 'Orders', to: '/account?tab=orders' }, { label: order.orderNumber }]} />

      {justPlaced && (
        <div className="mt-8 flex gap-4 bg-cream p-6 sm:p-8" role="status">
          <CheckCircle2 size={28} strokeWidth={1} className="shrink-0 text-gold-dark" />
          <div>
            <p className="font-serif text-2xl">Thank you — your order is confirmed.</p>
            <p className="mt-2 text-[14px] text-charcoal">
              {order.payment.method === 'cod' ? 'Please keep the amount ready for payment on delivery.' : 'Your payment has been received.'} Follow its progress here or on the{' '}
              <Link to={`/track?order=${order.orderNumber}`} className="underline underline-offset-4">
                Track Your Order
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      )}

      {order.status === 'pending_payment' && (
        <div className="mt-8 border border-champagne bg-cream p-6 sm:p-8" role="status">
          <p className="font-serif text-2xl">{params.get('payment') === 'cancelled' ? 'Payment was not completed.' : 'This order is awaiting payment.'}</p>
          <p className="mt-2 text-[14px] text-charcoal">Your order is saved but not confirmed. Complete the payment to confirm it — the items in your bag are still there.</p>
          {pay.error && <p className="mt-3 text-[14px] text-error">{pay.error}</p>}
          <button type="button" onClick={completePayment} disabled={pay.status === 'loading'} className="btn-dark mt-6">
            {pay.status === 'loading' ? 'Opening payment…' : 'Complete Payment'}
          </button>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="mt-2 text-[40px] leading-tight sm:text-[48px]">{order.orderNumber}</h1>
          <p className="mt-1 text-[14px] text-muted">Placed on {orderDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="label-caps text-gold-dark">{order.statusLabel}</p>
          <p className="mt-1 text-[13px] text-muted">{paymentLabel(order.payment)}</p>
        </div>
      </div>

      <div className="mt-10">
        <OrderProgress order={order} />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-3xl">Items</h2>
          <div className="mt-4">
            <OrderItems order={order} />
          </div>
        </div>
        <div className="space-y-10">
          <div>
            <h2 className="text-3xl">Delivery</h2>
            <address className="mt-4 text-[14px] not-italic leading-relaxed text-charcoal">
              {a.fullName}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.pincode}
              <br />
              {a.phone}
            </address>
            {order.tracking?.number && (
              <p className="mt-4 text-[14px]">
                {order.tracking.carrier} · {order.tracking.url ? (
                  <a href={order.tracking.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {order.tracking.number}
                  </a>
                ) : (
                  order.tracking.number
                )}
              </p>
            )}
          </div>
          <div>
            <h2 className="text-3xl">Updates</h2>
            <div className="mt-5">
              <OrderTimeline order={order} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
