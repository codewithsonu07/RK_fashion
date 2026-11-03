import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../../components/Field';
import { api } from '../../lib/api';
import { usePageTitle } from '../../lib/usePageTitle';

export default function ForgotPassword() {
  usePageTitle('Reset Password');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: '' });
    try {
      await api.forgotPassword(email);
      setState({ status: 'sent', error: '' });
    } catch (err) {
      setState({ status: 'error', error: err.fields?.email || err.message });
    }
  };

  return (
    <section className="container-luxe flex min-h-[60vh] justify-center py-16 sm:py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-[40px] leading-tight sm:text-[48px]">Reset Your Password</h1>
        <span className="gold-rule mt-5" />
        {state.status === 'sent' ? (
          <p className="mt-10 text-[15px] text-charcoal" role="status">
            If an account exists for {email}, a reset link is on its way. It is valid for one hour.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-10 space-y-7 text-left">
            <Field label="Email">
              <input type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {state.error && (
              <p className="text-[14px] text-error" role="alert">
                {state.error}
              </p>
            )}
            <button type="submit" disabled={state.status === 'loading'} className="btn-dark w-full">
              {state.status === 'loading' ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <Link to="/account/login" className="link-underline mt-10">
          Back to Sign In
        </Link>
      </div>
    </section>
  );
}
