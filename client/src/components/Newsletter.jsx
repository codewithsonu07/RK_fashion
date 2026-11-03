import { useState } from 'react';
import { api } from '../lib/api';

export default function Newsletter({ light = false }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', message: '' });
    try {
      await api.subscribe(email);
      setState({ status: 'done', message: 'Thank you — you are on the list for new collections and private previews.' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.fields?.email || err.message });
    }
  };

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <label htmlFor={`newsletter-${light ? 'l' : 'd'}`} className="sr-only">
        Email address
      </label>
      <div className={`flex items-end border-b ${light ? 'border-ivory/40' : 'border-ink/40'}`}>
        <input
          id={`newsletter-${light ? 'l' : 'd'}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className={`w-full bg-transparent py-3 text-[15px] outline-none ${light ? 'text-ivory placeholder:text-ivory/50' : 'placeholder:text-muted/70'}`}
        />
        <button type="submit" disabled={state.status === 'loading'} className={`label-caps shrink-0 py-3 pl-4 ${light ? 'text-champagne hover:text-ivory' : 'hover:text-gold-dark'}`}>
          {state.status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {state.message && (
        <p role="status" className={`mt-3 text-[13px] ${state.status === 'error' ? (light ? 'text-[#f0b7b7]' : 'text-error') : light ? 'text-ivory/80' : 'text-muted'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
