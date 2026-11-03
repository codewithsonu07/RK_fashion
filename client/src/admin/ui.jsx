import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from 'lucide-react';
import { admin } from './api';
import { img } from '../lib/image';

export function PageHeader({ title, text, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[34px] leading-tight">{title}</h1>
        {text && <p className="mt-1 text-[14px] text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className = '' }) {
  return (
    <section className={`border border-line bg-white/60 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="label-caps">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  gold: 'bg-champagne/25 text-gold-dark',
  green: 'bg-[#e3efe6] text-[#2f6b45]',
  red: 'bg-error/10 text-error',
  grey: 'bg-beige text-muted',
  ink: 'bg-ink text-ivory',
};
export function Badge({ tone = 'grey', children }) {
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[11px] tracking-wide ${TONES[tone]}`}>{children}</span>;
}

export function Btn({ variant = 'dark', small, className = '', ...props }) {
  const base = small ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-[11px]';
  const styles = {
    dark: 'bg-ink text-ivory hover:bg-gold-dark',
    outline: 'border border-ink/70 hover:bg-ink hover:text-ivory',
    ghost: 'text-muted hover:text-ink',
    danger: 'border border-error/50 text-error hover:bg-error hover:text-ivory',
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${base} ${styles[variant]} ${className}`}
    />
  );
}

export function Input({ label, error, hint, className = '', as: Tag = 'input', children, ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label-caps mb-1.5 block text-muted">{label}</span>}
      <Tag {...props} className="field-box py-2 text-[14px]" aria-invalid={!!error}>
        {children}
      </Tag>
      {hint && <span className="mt-1 block text-[12px] text-muted/80">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] text-error">{error}</span>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[14px]">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-sand'}`}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ivory transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </label>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-3 py-16 text-muted" aria-busy="true">
      <Loader2 size={18} className="animate-spin" /> Loading…
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="border border-error/40 bg-error/5 px-4 py-3 text-[13px] text-error" role="alert">
      {error.message || String(error)}
    </p>
  );
}

export function Drawer({ open, onClose, title, children, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end bg-ink/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={title} className={`flex h-full w-full ${width} flex-col bg-ivory shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

/** Upload + reorder + remove a list of image URLs. */
export function ImageListEditor({ images, onChange, max = 12, single = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef(null);
  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const { images: uploaded } = await admin.upload(files);
      const urls = uploaded.map((u) => u.url);
      onChange(single ? urls.slice(0, 1) : [...images, ...urls].slice(0, max));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const move = (i, d) => {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src + i} className="group relative h-28 w-21 bg-beige">
            <img src={img(src, 200, 266)} alt="" className="h-full w-full object-cover" />
            {i === 0 && !single && <span className="absolute left-1 top-1 bg-ink px-1.5 text-[9px] uppercase tracking-wider text-ivory">Main</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {!single && (
                <button type="button" className="p-1 text-ivory disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">
                  <ArrowUp size={13} className="-rotate-90" />
                </button>
              )}
              <button type="button" className="p-1 text-ivory" onClick={() => onChange(images.filter((_, x) => x !== i))} aria-label="Remove image">
                <X size={13} />
              </button>
              {!single && (
                <button type="button" className="p-1 text-ivory disabled:opacity-30" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move later">
                  <ArrowDown size={13} className="-rotate-90" />
                </button>
              )}
            </div>
          </div>
        ))}
        {(single ? images.length === 0 : images.length < max) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-28 w-21 flex-col items-center justify-center gap-1 border border-dashed border-sand text-[11px] text-muted hover:border-ink hover:text-ink"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} strokeWidth={1.25} />}
            {busy ? 'Uploading' : single ? 'Upload' : 'Add'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} className="sr-only" onChange={(e) => upload(e.target.files)} />
      <UrlAdder onAdd={(url) => onChange(single ? [url] : [...images, url].slice(0, max))} />
      {error && <p className="mt-2 text-[12px] text-error">{error.message}</p>}
    </div>
  );
}

function UrlAdder({ onAdd }) {
  const [url, setUrl] = useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="field-box flex-1 py-1.5 text-[13px]" />
      <Btn
        small
        variant="outline"
        disabled={!/^(https:\/\/|\/uploads\/)/.test(url.trim())}
        onClick={() => {
          onAdd(url.trim());
          setUrl('');
        }}
      >
        Add URL
      </Btn>
    </div>
  );
}

export const dateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const dateOnly = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Simple loader hook for admin pages. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const reload = useRef();
  reload.current = () =>
    fn()
      .then((data) => setState({ status: 'ready', data, error: null }))
      .catch((error) => setState({ status: 'error', data: null, error }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    reload.current();
  }, deps);
  return { ...state, reload: () => reload.current(), setData: (data) => setState((s) => ({ ...s, data })) };
}
