import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import AddressFields from '../components/AddressFields';
import { useAuth } from '../store/auth';
import { useShop } from '../store/shop';
import { api } from '../lib/api';
import { payWithRazorpay } from '../lib/razorpay';
import { formatPrice } from '../lib/format';
import { img } from '../lib/image';
import { usePageTitle } from '../lib/usePageTitle';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  usePageTitle('Checkout', null, { noindex: true });
  const { user, status: authStatus } = useAuth();
  const { bag, bagTotal } = useShop();
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState(null);

  useEffect(() => {
    api.checkoutOptions().then(setOptions).catch(setOptionsError);
  }, []);

  if (bag.length === 0)
    return (
      <section className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="text-[44px]">Checkout</h1>
        <p className="mt-6 text-[15px] text-muted">Your bag is empty.</p>
        <Link to="/new-arrivals" className="btn-dark mt-10">
          Discover New Arrivals
        </Link>
      </section>
    );

  const anyMethod = options && (options.methods.razorpay || options.methods.cod);

  return (
    <section className="container-luxe py-14 sm:py-20">
      <h1 className="text-[44px] sm:text-[56px]">Checkout</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {authStatus === 'loading' || (!options && !optionsError) ? (
            <div className="h-64 animate-pulse bg-beige" />
          ) : optionsError ? (
            <p className="text-error">{optionsError.message}</p>
          ) : !user ? (
            <SignInPrompt />
          ) : !anyMethod ? (
            <PaymentsUnavailable />
          ) : (
            <CheckoutForm options={options} />
          )}
        </div>
        <Summary bag={bag} total={bagTotal} shippingFee={options?.shippingFee || 0} />
      </div>
    </section>
  );
}

function SignInPrompt() {
  return (
    <div className="border border-line p-8 sm:p-12">
      <p className="eyebrow">Step 1</p>
      <h2 className="mt-4 text-[32px] leading-tight">Sign in to complete your order</h2>
      <p className="mt-4 text-[15px] text-charcoal">An account lets you track your order, view your order history and keep your bag across devices. Your bag will be kept.</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link to="/account/login?next=/checkout" className="btn-dark">
          Sign In
        </Link>
        <Link to="/account/register?next=/checkout" className="btn-outline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

function PaymentsUnavailable() {
  return (
    <div className="border border-champagne/60 bg-cream p-8 sm:p-12">
      <p className="eyebrow">Secure Online Payments — Coming Soon</p>
      <h2 className="mt-4 text-[32px] leading-tight">Online checkout is being set up.</h2>
      <p className="mt-5 text-[15px] leading-relaxed text-charcoal">
        Payments by UPI, cards and net banking are being finalised. Our studio team will gladly reserve the pieces in your bag and complete your order personally.
      </p>
      <p className="mt-4 text-[14px] text-muted">No payment has been taken and no order has been placed.</p>
      <Link to="/appointment" className="btn-dark mt-8">
        Book a Consultation
      </Link>
    </div>
  );
}

function CheckoutForm({ options }) {
  const { user, updateProfile } = useAuth();
  const { bag, clearBag } = useShop();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ ...emptyAddress, fullName: user.name, phone: user.phone || '', ...(user.address || {}) });
  const [saveAddress, setSaveAddress] = useState(!user.address);
  const [method, setMethod] = useState(options.methods.razorpay ? 'razorpay' : 'cod');
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', error: '' });

  const setAddr = (k, v) => {
    setAddress((a) => ({ ...a, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Required.';
    if (!/^[+()\-\s\d]{8,20}$/.test(address.phone)) e.phone = 'Enter a valid phone number.';
    if (!address.line1.trim()) e.line1 = 'Required.';
    if (!address.city.trim()) e.city = 'Required.';
    if (!address.state) e.state = 'Select a state.';
    if (!/^[1-9]\d{5}$/.test(address.pincode)) e.pincode = 'Enter a valid 6-digit PIN code.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setState({ status: 'loading', error: '' });
    try {
      const items = bag.map(({ slug, size, colour, qty }) => ({ slug, size, colour, qty }));
      const res = await api.createOrder({ paymentMethod: method, address, saveAddress, items });
      if (saveAddress) updateProfile({ address }).catch(() => {});

      if (method === 'cod') {
        clearBag();
        navigate(`/account/orders/${res.order.orderNumber}?placed=1`);
        return;
      }

      setState({ status: 'paying', error: '' });
      const payment = await payWithRazorpay({ razorpay: res.razorpay, order: res.order, customer: { name: user.name, email: user.email, phone: address.phone } });
      if (!payment) {
        // Closed the payment window: the order exists but is unpaid.
        navigate(`/account/orders/${res.order.orderNumber}?payment=cancelled`);
        return;
      }
      setState({ status: 'verifying', error: '' });
      await api.verifyPayment(res.order.orderNumber, payment);
      clearBag();
      navigate(`/account/orders/${res.order.orderNumber}?placed=1`);
    } catch (err) {
      setErrors(err.fields || {});
      setState({ status: 'error', error: err.message });
    }
  };

  const busy = ['loading', 'paying', 'verifying'].includes(state.status);

  return (
    <form onSubmit={placeOrder} noValidate className="space-y-12">
      <div>
        <p className="eyebrow">Step 1</p>
        <h2 className="mt-3 text-[32px]">Delivery address</h2>
        <p className="mt-2 text-[13px] text-muted">We currently deliver within India.</p>
        <AddressFields value={address} onChange={setAddr} errors={errors} />
        <label className="mt-6 flex cursor-pointer items-center gap-3 text-[13px]">
          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-ink" />
          Save this address to my account
        </label>
      </div>

      <fieldset>
        <legend>
          <span className="eyebrow block">Step 2</span>
          <span className="mt-3 block font-serif text-[32px]">Payment</span>
        </legend>
        <div className="mt-6 space-y-3">
          {options.methods.razorpay && (
            <PayOption checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} title="Pay online" text="UPI, credit & debit cards, net banking and wallets — secured by Razorpay." />
          )}
          {options.methods.cod && <PayOption checked={method === 'cod'} onChange={() => setMethod('cod')} title="Cash on delivery" text="Pay in cash or UPI when your order is delivered." />}
        </div>
      </fieldset>

      {state.status === 'error' && (
        <p className="border border-error/40 bg-error/5 p-4 text-[14px] text-error" role="alert">
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={busy} className="btn-dark w-full sm:w-auto">
          <Lock size={14} strokeWidth={1.25} />
          {state.status === 'loading'
            ? 'Placing order…'
            : state.status === 'paying'
              ? 'Complete payment in the window…'
              : state.status === 'verifying'
                ? 'Confirming payment…'
                : method === 'cod'
                  ? 'Place Order'
                  : 'Continue to Payment'}
        </button>
        <p className="mt-4 text-[12px] text-muted">
          By placing your order you agree to our{' '}
          <Link to="/pages/terms" className="underline underline-offset-4">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/pages/returns" className="underline underline-offset-4">
            returns policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

function PayOption({ checked, onChange, title, text }) {
  return (
    <label className={`flex cursor-pointer gap-4 border p-5 transition-colors ${checked ? 'border-ink' : 'border-sand hover:border-ink'}`}>
      <input type="radio" name="payment" checked={checked} onChange={onChange} className="mt-1 accent-ink" />
      <span>
        <span className="block font-serif text-xl">{title}</span>
        <span className="mt-1 block text-[13px] text-muted">{text}</span>
      </span>
    </label>
  );
}

function Summary({ bag, total, shippingFee }) {
  return (
    <aside className="h-fit bg-beige p-8 lg:sticky lg:top-40">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Order Summary</p>
        <Link to="/bag" className="text-[12px] text-muted underline underline-offset-4 hover:text-ink">
          Edit bag
        </Link>
      </div>
      <ul className="mt-6 space-y-4">
        {bag.map((i) => (
          <li key={i.key} className="flex gap-4 text-[14px]">
            <img src={img(i.image, 120, 160)} alt="" className="h-20 w-15 object-cover" />
            <div className="flex-1">
              <p className="font-serif text-lg leading-tight">{i.name}</p>
              <p className="text-[12px] text-muted">
                Size {i.size} · Qty {i.qty}
              </p>
            </div>
            <p>{formatPrice(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-sand pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{shippingFee ? formatPrice(shippingFee) : 'Complimentary'}</dd>
        </div>
        <div className="flex justify-between pt-2 font-serif text-2xl">
          <dt>Total</dt>
          <dd>{formatPrice(total + shippingFee)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[12px] text-muted">Prices include all taxes. Final prices and stock are confirmed when you place the order.</p>
    </aside>
  );
}
