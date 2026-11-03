import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Field } from '../../components/Field';
import { useAuth } from '../../store/auth';
import { usePageTitle } from '../../lib/usePageTitle';

// Only allow redirects back into this site.
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/account');

export default function AuthPage({ mode: initialMode = 'login' }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', error: '' });
  const [show, setShow] = useState(false);
  const next = safeNext(params.get('next'));
  usePageTitle(mode === 'login' ? 'Sign In' : 'Create Account');

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (mode === 'register' && !form.name.trim()) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (mode === 'register' && form.phone && !/^[+()\-\s\d]{8,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';
    if (!form.password) errs.password = 'Please enter your password.';
    else if (mode === 'register' && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)))
      errs.password = 'Use at least 8 characters with a letter and a number.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState({ status: 'loading', error: '' });
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
      // Redirect happens in the effect once `user` is set.
    } catch (err) {
      setState({ status: 'error', error: err.message });
      setErrors(err.fields || {});
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setState({ status: 'idle', error: '' });
  };

  return (
    <section className="container-luxe flex min-h-[70vh] items-start justify-center py-16 sm:py-24">
      <div className="w-full max-w-md">
        <h1 className="text-center text-[44px] leading-tight sm:text-[52px]">{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h1>
        <span className="gold-rule mt-5" />
        <div className="mt-10 grid grid-cols-2 border-b border-line" role="tablist">
          {[
            ['login', 'Sign In'],
            ['register', 'Register'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`label-caps -mb-px border-b py-4 transition-colors ${mode === m ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="mt-10 space-y-7">
          {mode === 'register' && (
            <Field label="Full name" error={errors.name}>
              <input className="field" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
            </Field>
          )}
          <Field label="Email" error={errors.email}>
            <input type="email" className="field" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
          </Field>
          {mode === 'register' && (
            <Field label="Phone (optional)" error={errors.phone}>
              <input type="tel" className="field" autoComplete="tel" placeholder="+91" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
            </Field>
          )}
          <Field id="auth-password" label="Password" error={errors.password} hint={mode === 'register' ? 'At least 8 characters, with a letter and a number.' : undefined}>
            <div className="relative">
              <input
                id="auth-password"
                type={show ? 'text' : 'password'}
                className="field pr-10"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                aria-invalid={!!errors.password}
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
              </button>
            </div>
          </Field>

          {state.status === 'error' && (
            <p className="border border-error/40 bg-error/5 p-4 text-[14px] text-error" role="alert">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={state.status === 'loading'} className="btn-dark w-full">
            {state.status === 'loading' ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'login' && (
            <p className="text-center">
              <Link to="/account/forgot-password" className="text-[13px] text-muted underline underline-offset-4 hover:text-ink">
                Forgotten your password?
              </Link>
            </p>
          )}
        </form>

        <div className="mt-12 bg-cream p-6 text-[13px] leading-relaxed text-charcoal">
          <p className="label-caps">With an RK FASHIONS account</p>
          <ul className="mt-3 space-y-1.5 text-muted">
            <li>· Your wishlist and bag follow you across devices</li>
            <li>· Check out faster with a saved address</li>
            <li>· View order history and track deliveries</li>
            <li>· See your appointments and bespoke enquiries</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
