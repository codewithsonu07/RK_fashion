import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Heart, LogOut, Package, Scissors, ShoppingBag } from 'lucide-react';
import { Field } from '../components/Field';
import AddressFields from '../components/AddressFields';
import { orderDate, paymentLabel } from '../components/OrderStatus';
import { appointmentTypes } from '../data/site';
import { useAuth } from '../store/auth';
import { useShop } from '../store/shop';
import { api } from '../lib/api';
import { formatDate, formatPrice, formatTime } from '../lib/format';
import { img } from '../lib/image';
import { usePageTitle } from '../lib/usePageTitle';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'appointments', label: 'Appointments & Bespoke' },
  { key: 'profile', label: 'Profile & Address' },
];

export default function Account() {
  usePageTitle('My Account', null, { noindex: true });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview';
  const [orders, setOrders] = useState({ status: 'loading', list: [], error: null });
  const [activity, setActivity] = useState({ status: 'loading', appointments: [], enquiries: [], error: null });

  useEffect(() => {
    api
      .myOrders()
      .then(({ orders }) => setOrders({ status: 'ready', list: orders, error: null }))
      .catch((error) => setOrders({ status: 'error', list: [], error }));
    api
      .activity()
      .then((r) => setActivity({ status: 'ready', ...r, error: null }))
      .catch((error) => setActivity({ status: 'error', appointments: [], enquiries: [], error }));
  }, []);

  const signOut = async () => {
    navigate('/'); // leave the protected page first so it doesn't redirect to sign-in
    await logout();
  };

  return (
    <section className="container-luxe min-h-[70vh] py-14 sm:py-20">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="mt-3 text-[40px] leading-tight sm:text-[52px]">Namaste, {user.name.split(' ')[0]}</h1>
        </div>
        <button type="button" onClick={signOut} className="label-caps flex items-center gap-2 self-start text-muted hover:text-ink sm:self-auto">
          <LogOut size={15} strokeWidth={1.25} /> Sign Out
        </button>
      </div>

      <div className="scrollbar-none mt-10 flex gap-8 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setParams(t.key === 'overview' ? {} : { tab: t.key }, { replace: true })}
            className={`label-caps -mb-px shrink-0 border-b py-4 transition-colors ${tab === t.key ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === 'overview' && <Overview orders={orders} activity={activity} />}
        {tab === 'orders' && <Orders orders={orders} />}
        {tab === 'appointments' && <Activity activity={activity} />}
        {tab === 'profile' && <Profile />}
      </div>
    </section>
  );
}

function Overview({ orders, activity }) {
  const { wishlist, bagCount } = useShop();
  const upcoming = activity.appointments.filter((a) => ['requested', 'confirmed'].includes(a.status));
  const tiles = [
    { icon: Package, label: 'Orders', text: orders.status === 'ready' ? `${orders.list.length} placed` : '—', to: '/account?tab=orders' },
    { icon: Heart, label: 'Wishlist', text: `${wishlist.length} saved`, to: '/wishlist' },
    { icon: ShoppingBag, label: 'Bag', text: `${bagCount} ${bagCount === 1 ? 'item' : 'items'}`, to: '/bag' },
    { icon: CalendarDays, label: 'Appointments', text: `${upcoming.length} upcoming`, to: '/account?tab=appointments' },
  ];
  const latest = orders.list[0];
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, text, to }) => (
          <Link key={label} to={to} className="border border-line p-6 transition-colors hover:border-ink">
            <Icon size={22} strokeWidth={1} className="text-gold-dark" />
            <p className="mt-5 font-serif text-xl">{label}</p>
            <p className="mt-1 text-[13px] text-muted">{text}</p>
          </Link>
        ))}
      </div>
      {latest && (
        <div>
          <p className="label-caps mb-4">Latest order</p>
          <OrderRow order={latest} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/appointment" className="flex items-center gap-4 bg-cream p-6 transition-colors hover:bg-beige">
          <CalendarDays size={22} strokeWidth={1} className="text-gold-dark" />
          <span>
            <span className="block font-serif text-xl">Book a consultation</span>
            <span className="text-[13px] text-muted">In-store, online, bridal or groom</span>
          </span>
        </Link>
        <Link to="/bespoke" className="flex items-center gap-4 bg-cream p-6 transition-colors hover:bg-beige">
          <Scissors size={22} strokeWidth={1} className="text-gold-dark" />
          <span>
            <span className="block font-serif text-xl">Start a bespoke design</span>
            <span className="text-[13px] text-muted">Share your vision with the designer</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <Link to={`/account/orders/${order.orderNumber}`} className="flex flex-wrap items-center gap-5 border border-line p-5 transition-colors hover:border-ink">
      <div className="flex -space-x-4">
        {order.items.slice(0, 3).map((i) => (
          <img key={i.slug + i.size} src={img(i.image, 100, 130)} alt="" className="h-16 w-12 border-2 border-ivory object-cover" />
        ))}
      </div>
      <div className="min-w-40 flex-1">
        <p className="font-serif text-xl">{order.orderNumber}</p>
        <p className="text-[13px] text-muted">
          {orderDate(order.createdAt)} · {order.items.reduce((n, i) => n + i.qty, 0)} items
        </p>
      </div>
      <div className="text-right">
        <p className="label-caps text-gold-dark">{order.statusLabel}</p>
        <p className="mt-1 text-[14px]">{formatPrice(order.total)}</p>
        <p className="text-[12px] text-muted">{paymentLabel(order.payment)}</p>
      </div>
    </Link>
  );
}

function Orders({ orders }) {
  if (orders.status === 'loading') return <div className="h-24 animate-pulse bg-beige" />;
  if (orders.status === 'error') return <p className="text-error">{orders.error.message}</p>;
  if (!orders.list.length)
    return (
      <div className="py-12 text-center">
        <p className="font-serif text-2xl">No orders yet.</p>
        <Link to="/new-arrivals" className="btn-dark mt-8">
          Discover New Arrivals
        </Link>
      </div>
    );
  return (
    <div className="space-y-4">
      {orders.list.map((o) => (
        <OrderRow key={o.orderNumber} order={o} />
      ))}
    </div>
  );
}

const APPT_STATUS = {
  requested: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
};
const ENQ_STATUS = {
  new: 'Received',
  'in-review': 'In review',
  'consultation-scheduled': 'Consultation scheduled',
  quoted: 'Quotation sent',
  approved: 'Design approved',
  'in-production': 'In production',
  delivered: 'Delivered',
  closed: 'Closed',
};

function Activity({ activity }) {
  if (activity.status === 'loading') return <div className="h-24 animate-pulse bg-beige" />;
  if (activity.status === 'error') return <p className="text-error">{activity.error.message}</p>;
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Appointments</h2>
          <Link to="/appointment" className="link-underline text-gold-dark">
            Book
          </Link>
        </div>
        {activity.appointments.length === 0 ? (
          <p className="mt-6 text-[14px] text-muted">No appointments booked while signed in.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {activity.appointments.map((a) => (
              <li key={a.reference} className="border border-line p-5">
                <div className="flex justify-between gap-4">
                  <p className="font-serif text-xl">{appointmentTypes.find((t) => t.value === a.type)?.label}</p>
                  <span className="label-caps shrink-0 text-gold-dark">{APPT_STATUS[a.status]}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {formatTime(a.time)} · Ref {a.reference}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Bespoke Enquiries</h2>
          <Link to="/bespoke" className="link-underline text-gold-dark">
            New
          </Link>
        </div>
        {activity.enquiries.length === 0 ? (
          <p className="mt-6 text-[14px] text-muted">No bespoke enquiries submitted while signed in.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {activity.enquiries.map((e) => (
              <li key={e.reference} className="border border-line p-5">
                <div className="flex justify-between gap-4">
                  <p className="font-serif text-xl">{e.garment}</p>
                  <span className="label-caps shrink-0 text-gold-dark">{ENQ_STATUS[e.status]}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {orderDate(e.createdAt)} · Ref {e.reference}
                </p>
                {e.quote?.amount && <p className="mt-2 text-[14px]">Quotation: {formatPrice(e.quote.amount)}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    address: { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', ...(user.address || {}) },
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErrors, setPwErrors] = useState({});

  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    setErrors({});
    const hasAddress = Object.entries(form.address).some(([k, v]) => k !== 'country' && v);
    try {
      await updateProfile({ name: form.name, phone: form.phone, address: hasAddress ? form.address : {} });
      setMsg({ ok: true, text: 'Your details have been saved.' });
    } catch (err) {
      setErrors(err.fields || {});
      setMsg({ ok: false, text: err.message });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErrors({});
    try {
      await api.changePassword(pw);
      setPw({ current: '', next: '' });
      setPwMsg({ ok: true, text: 'Your password has been changed.' });
    } catch (err) {
      setPwErrors(err.fields || {});
      setPwMsg({ ok: false, text: err.message });
    }
  };

  return (
    <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={save} noValidate className="space-y-10">
        <div>
          <h2 className="text-3xl">Personal details</h2>
          <div className="mt-6 grid gap-7 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="field text-muted" value={user.email} disabled />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input type="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="text-3xl">Saved delivery address</h2>
          <AddressFields value={form.address} onChange={setAddr} errors={errors} />
        </div>
        {msg && (
          <p role="status" className={`text-[14px] ${msg.ok ? 'text-gold-dark' : 'text-error'}`}>
            {msg.text}
          </p>
        )}
        <button type="submit" className="btn-dark">
          Save Details
        </button>
      </form>

      <form onSubmit={changePassword} noValidate className="h-fit space-y-7 bg-cream p-8">
        <h2 className="text-3xl">Change password</h2>
        <Field label="Current password" error={pwErrors.current}>
          <input type="password" className="field" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </Field>
        <Field label="New password" error={pwErrors.next} hint="At least 8 characters, with a letter and a number.">
          <input type="password" className="field" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </Field>
        {pwMsg && (
          <p role="status" className={`text-[14px] ${pwMsg.ok ? 'text-gold-dark' : 'text-error'}`}>
            {pwMsg.text}
          </p>
        )}
        <button type="submit" className="btn-outline w-full">
          Update Password
        </button>
      </form>
    </div>
  );
}
