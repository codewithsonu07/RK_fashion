import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field } from '../../components/Field';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';
import { usePageTitle } from '../../lib/usePageTitle';

export default function ResetPassword() {
  usePageTitle('Choose a New Password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ status: 'idle', error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: '' });
    try {
      const { user } = await api.resetPassword({ token: params.get('token'), password });
      setUser(user);
      navigate('/account');
    } catch (err) {
      setState({ status: 'error', error: err.fields?.password || err.message });
    }
  };

  return (
    <section className="container-luxe flex min-h-[60vh] justify-center py-16 sm:py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-[40px] leading-tight sm:text-[48px]">Choose a New Password</h1>
        <span className="gold-rule mt-5" />
        <form onSubmit={submit} noValidate className="mt-10 space-y-7 text-left">
          <Field label="New password" hint="At least 8 characters, with a letter and a number.">
            <input type="password" className="field" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {state.error && (
            <p className="text-[14px] text-error" role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={state.status === 'loading' || !params.get('token')} className="btn-dark w-full">
            {state.status === 'loading' ? 'Saving…' : 'Save Password'}
          </button>
        </form>
        <Link to="/account/forgot-password" className="link-underline mt-10">
          Request a new link
        </Link>
      </div>
    </section>
  );
}
