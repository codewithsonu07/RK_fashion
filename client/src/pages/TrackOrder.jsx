import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Field } from '../components/Field';
import { OrderItems, OrderProgress, OrderTimeline, orderDate } from '../components/OrderStatus';
import { useAuth } from '../store/auth';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

export default function TrackOrder() {
  usePageTitle('Track Your Order');
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState({ orderNumber: params.get('order') || '', email: user?.email || '' });
  const [state, setState] = useState({ status: 'idle', order: null, error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', order: null, error: null });
    try {
      const { order } = await api.trackOrder(form);
      setState({ status: 'ready', order, error: null });
    } catch (error) {
      setState({ status: 'error', order: null, error });
    }
  };

  const { order } = state;
  return (
    <section className="container-luxe min-h-[70vh] py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-[44px] leading-tight sm:text-[56px]">Track Your Order</h1>
        <span className="gold-rule mt-5" />
        <p className="mt-6 text-[15px] text-muted">Enter your order number (e.g. RKO-2611-ABCDE) and the email used for the order.</p>
      </div>
      <form onSubmit={submit} className="mx-auto mt-10 grid max-w-xl gap-7 sm:grid-cols-2" noValidate>
        <Field label="Order number">
          <input className="field uppercase" required value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" className="field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          {state.status === 'error' && (
            <p className="mb-4 text-[14px] text-error" role="alert">
              {state.error.fields?.email || state.error.fields?.orderNumber || state.error.message}
            </p>
          )}
          <button type="submit" disabled={state.status === 'loading'} className="btn-dark w-full">
            {state.status === 'loading' ? 'Searching…' : 'Track Order'}
          </button>
          {user && (
            <p className="mt-4 text-center text-[13px] text-muted">
              Or see all your orders in{' '}
              <Link to="/account?tab=orders" className="underline underline-offset-4">
                My Account
              </Link>
              .
            </p>
          )}
        </div>
      </form>

      {order && (
        <div className="mx-auto mt-16 max-w-3xl border-t border-line pt-12" role="status">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-serif text-3xl">{order.orderNumber}</p>
              <p className="text-[13px] text-muted">
                Placed {orderDate(order.createdAt)} · Delivering to {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            </div>
            <p className="label-caps text-gold-dark">{order.statusLabel}</p>
          </div>
          <div className="mt-10">
            <OrderProgress order={order} />
          </div>
          {order.tracking?.number && (
            <p className="mt-8 text-[14px]">
              Courier: {order.tracking.carrier} · Tracking number {order.tracking.number}
            </p>
          )}
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <OrderTimeline order={order} />
            <OrderItems order={order} />
          </div>
        </div>
      )}
    </section>
  );
}
