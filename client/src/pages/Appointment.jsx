import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import { Field, FieldError } from '../components/Field';
import { appointmentTypes, brand, home } from '../data/site';
import { api } from '../lib/api';
import { formatDate, formatTime } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';

const VISIBLE_DAYS = 7;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const blank = { name: '', email: '', phone: '', gender: '', type: '', eventDate: '', requirements: '', message: '' };

export default function Appointment() {
  usePageTitle('Book an Appointment', 'Book a personal design consultation with RK FASHIONS — in-store, online, bridal, groom, bespoke and measurement appointments.');
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState({ status: 'idle', list: [], reason: null });
  const [time, setTime] = useState('');
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [submit, setSubmit] = useState({ status: 'idle', error: null, result: null });

  useEffect(() => {
    api.appointmentConfig().then(setConfig).catch(setConfigError);
  }, []);

  const days = useMemo(() => {
    if (!config) return [];
    return Array.from({ length: config.bookingWindowDays + 1 }, (_, i) => {
      const iso = addDays(config.today, i);
      const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
      return { iso, closed: config.closedWeekdays.includes(weekday) || config.closedDates.includes(iso) };
    });
  }, [config]);

  const loadSlots = useCallback((d) => {
    setSlots({ status: 'loading', list: [], reason: null });
    api
      .slots(d)
      .then((r) => setSlots({ status: 'ready', list: r.slots, reason: r.reason }))
      .catch((err) => setSlots({ status: 'error', list: [], reason: err.message }));
  }, []);

  const pickDate = (d) => {
    setDate(d);
    setTime('');
    setErrors((e) => ({ ...e, date: undefined, time: undefined }));
    loadSlots(d);
  };

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Choose an appointment type.';
    if (!date) e.date = 'Choose a date.';
    if (!time) e.time = 'Choose an available time.';
    if (!form.name.trim()) e.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!/^[+()\-\s\d]{8,20}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    if (!form.gender) e.gender = 'Please choose one.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const book = async (e) => {
    e.preventDefault();
    if (!validate()) {
      document.querySelector('[aria-invalid="true"], [data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmit({ status: 'loading', error: null, result: null });
    try {
      const result = await api.bookAppointment({ ...form, date, time });
      setSubmit({ status: 'done', error: null, result });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmit({ status: 'error', error: err, result: null });
      setErrors(err.fields || {});
      if (err.status === 409) {
        setTime('');
        loadSlots(date);
      }
    }
  };

  if (submit.status === 'done') return <Confirmation result={submit.result} form={form} />;

  const visible = days.slice(offset, offset + VISIBLE_DAYS);
  const typeInfo = appointmentTypes.find((t) => t.value === form.type);

  return (
    <>
      <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-ink text-ivory">
        <Img src={home.appointment.image} alt="" width={1800} eager position="50% 30%" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/20" />
        <div className="container-luxe relative z-10 pb-14 sm:pb-20">
          <p className="eyebrow text-champagne">Personal Consultations</p>
          <motion.h1
            className="mt-5 max-w-4xl text-[40px] leading-[1.02] sm:text-[68px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            BOOK YOUR PERSONAL DESIGN CONSULTATION
          </motion.h1>
          <p className="mt-5 max-w-xl text-[15px] text-ivory/85">{brand.contact.hours}</p>
        </div>
      </section>

      <form onSubmit={book} noValidate className="container-luxe grid gap-14 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-16">
          {/* 1. Type */}
          <fieldset data-error={!!errors.type}>
            <legend className="font-serif text-3xl">
              <span className="mr-3 text-champagne">01</span>Appointment type
            </legend>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {appointmentTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('type', t.value)}
                  aria-pressed={form.type === t.value}
                  className={`border p-5 text-left transition-colors ${form.type === t.value ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-serif text-[21px] leading-tight">{t.label}</span>
                    <span className={`shrink-0 text-[11px] tracking-wider ${form.type === t.value ? 'text-champagne' : 'text-muted'}`}>{t.duration}</span>
                  </span>
                  <span className={`mt-2 block text-[13px] ${form.type === t.value ? 'text-ivory/75' : 'text-muted'}`}>{t.text}</span>
                </button>
              ))}
            </div>
            <FieldError>{errors.type}</FieldError>
          </fieldset>

          {/* 2. Date & time */}
          <fieldset data-error={!!(errors.date || errors.time)}>
            <legend className="font-serif text-3xl">
              <span className="mr-3 text-champagne">02</span>Preferred date & time
            </legend>
            {configError && <p className="mt-6 text-[14px] text-error">{configError.message}</p>}
            {!config && !configError && <div className="mt-8 h-24 animate-pulse bg-beige" />}
            {config && (
              <>
                <div className="mt-8 flex items-center gap-2">
                  <button type="button" onClick={() => setOffset(Math.max(0, offset - VISIBLE_DAYS))} disabled={offset === 0} className="p-2 disabled:opacity-30" aria-label="Previous week">
                    <ChevronLeft size={18} strokeWidth={1.25} />
                  </button>
                  <div className="grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
                    {visible.map((d) => {
                      const dt = new Date(`${d.iso}T00:00:00`);
                      const on = date === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          disabled={d.closed}
                          onClick={() => pickDate(d.iso)}
                          aria-pressed={on}
                          aria-label={`${formatDate(d.iso)}${d.closed ? ' — studio closed' : ''}`}
                          className={`flex flex-col items-center border py-3 transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:text-muted/40 ${
                            on ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-[0.14em]">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                          <span className="mt-1 font-serif text-2xl leading-none">{dt.getDate()}</span>
                          <span className="mt-1 text-[10px] uppercase tracking-[0.1em]">{dt.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOffset(Math.min(days.length - VISIBLE_DAYS, offset + VISIBLE_DAYS))}
                    disabled={offset + VISIBLE_DAYS >= days.length}
                    className="p-2 disabled:opacity-30"
                    aria-label="Next week"
                  >
                    <ChevronRight size={18} strokeWidth={1.25} />
                  </button>
                </div>
                <FieldError>{errors.date}</FieldError>

                <div className="mt-8" aria-live="polite">
                  {!date && <p className="text-[14px] text-muted">Select a date to see available times. The studio is closed on Mondays.</p>}
                  {slots.status === 'loading' && <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-12 animate-pulse bg-beige" />)}</div>}
                  {slots.status === 'error' && <p className="text-[14px] text-error">{slots.reason}</p>}
                  {slots.status === 'ready' && (
                    <>
                      <p className="label-caps mb-4 text-muted">{formatDate(date)}</p>
                      {slots.list.length === 0 ? (
                        <p className="text-[14px] text-muted">{slots.reason}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {slots.list.map((s) => (
                            <button
                              key={s.time}
                              type="button"
                              disabled={!s.available}
                              onClick={() => {
                                setTime(s.time);
                                setErrors((e) => ({ ...e, time: undefined }));
                              }}
                              aria-pressed={time === s.time}
                              className={`border py-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:border-line disabled:text-muted/50 disabled:line-through ${
                                time === s.time ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'
                              }`}
                            >
                              {formatTime(s.time)}
                              {!s.available && <span className="sr-only"> — booked</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <FieldError>{errors.time}</FieldError>
                </div>
              </>
            )}
          </fieldset>

          {/* 3. Details */}
          <fieldset>
            <legend className="font-serif text-3xl">
              <span className="mr-3 text-champagne">03</span>Your details
            </legend>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <Field label="Full name *" error={errors.name}>
                <input className="field" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input type="email" className="field" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
              </Field>
              <Field label="Phone number *" error={errors.phone}>
                <input type="tel" className="field" autoComplete="tel" placeholder="+91" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
              </Field>
              <div data-error={!!errors.gender}>
                <p className="label-caps text-muted">Consultation for *</p>
                <div className="mt-3 flex gap-3">
                  {[
                    ['women', 'Women'],
                    ['men', 'Men'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('gender', v)}
                      aria-pressed={form.gender === v}
                      className={`flex-1 border py-3 text-[13px] transition-colors ${form.gender === v ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <FieldError>{errors.gender}</FieldError>
              </div>
              <Field label="Event date (optional)">
                <input type="date" className="field" value={form.eventDate} min={config?.today} onChange={(e) => set('eventDate', e.target.value)} />
              </Field>
              <div className="hidden sm:block" />
              <Field label="Outfit requirements" className="sm:col-span-2" hint="E.g. bridal lehenga for a December wedding, matching sherwani for the groom">
                <textarea rows={3} className="field-box" value={form.requirements} onChange={(e) => set('requirements', e.target.value)} maxLength={1500} />
              </Field>
              <Field label="Additional message" className="sm:col-span-2">
                <textarea rows={3} className="field-box" value={form.message} onChange={(e) => set('message', e.target.value)} maxLength={1500} />
              </Field>
            </div>
          </fieldset>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="bg-beige p-8 sm:p-10">
            <p className="eyebrow">Your Appointment</p>
            <dl className="mt-6 space-y-5 text-[14px]">
              <div>
                <dt className="label-caps text-muted">Type</dt>
                <dd className="mt-1 font-serif text-xl">{typeInfo ? typeInfo.label : '—'}</dd>
              </div>
              <div className="flex gap-8">
                <div>
                  <dt className="label-caps text-muted">Date</dt>
                  <dd className="mt-1 font-serif text-xl">{date ? formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</dd>
                </div>
                <div>
                  <dt className="label-caps text-muted">Time</dt>
                  <dd className="mt-1 font-serif text-xl">{time ? formatTime(time) : '—'}</dd>
                </div>
              </div>
              {typeInfo && (
                <div className="flex items-center gap-2 text-muted">
                  <Clock size={14} strokeWidth={1.25} /> Approx. {typeInfo.duration}
                </div>
              )}
            </dl>
            {submit.status === 'error' && (
              <p className="mt-6 border border-error/40 bg-error/5 p-4 text-[13px] text-error" role="alert">
                {submit.error.message}
              </p>
            )}
            <button type="submit" disabled={submit.status === 'loading'} className="btn-dark mt-8 w-full">
              {submit.status === 'loading' ? 'Requesting…' : 'Request Appointment'}
            </button>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              Your chosen slot is held for you as soon as you submit. Our studio team will then confirm the appointment personally.
            </p>
          </div>
          <Reveal className="mt-6 border border-line p-8 text-[13px] leading-relaxed text-charcoal">
            <p className="label-caps">Planning something bespoke?</p>
            <p className="mt-3 text-muted">Share your ideas, fabrics and inspiration images before you visit so the designer can prepare.</p>
            <Link to="/bespoke" className="link-underline mt-4 text-gold-dark">
              Open the Bespoke Studio
            </Link>
          </Reveal>
        </aside>
      </form>
    </>
  );
}

function Confirmation({ result, form }) {
  const typeInfo = appointmentTypes.find((t) => t.value === form.type);
  return (
    <section className="container-luxe flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-2xl bg-beige px-6 py-14 text-center sm:px-14" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-champagne text-gold-dark">
          <CalendarCheck size={26} strokeWidth={1.25} />
        </span>
        <p className="eyebrow mt-8">Request Received</p>
        <h1 className="mt-4 text-[38px] leading-tight sm:text-[48px]">Your slot is reserved.</h1>
        <p className="mt-6 text-[14px] text-muted">Appointment reference</p>
        <p className="mt-2 font-serif text-3xl tracking-[0.12em]">{result.reference}</p>
        <dl className="mx-auto mt-8 grid max-w-md gap-4 border-y border-sand py-6 text-left text-[14px] sm:grid-cols-2">
          <div>
            <dt className="label-caps text-muted">Consultation</dt>
            <dd className="mt-1">{typeInfo?.label}</dd>
          </div>
          <div>
            <dt className="label-caps text-muted">When</dt>
            <dd className="mt-1">
              {formatDate(result.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(result.time)}
            </dd>
          </div>
        </dl>
        <p className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-charcoal">
          <Check size={14} className="mr-1 inline text-gold-dark" />
          The time is held exclusively for you while our studio team reviews your request. Status: <strong className="font-normal">awaiting studio confirmation</strong> — we will contact you
          at {form.phone} or {form.email} to confirm.
        </p>
        <p className="mx-auto mt-4 max-w-lg text-[13px] text-muted">
          {result.emailed ? `A copy of your request has been emailed to ${form.email}.` : 'Please note your reference number — email notifications are not yet enabled.'}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/bespoke" className="btn-dark">
            Prepare Your Design Brief
          </Link>
          <Link to="/" className="btn-outline">
            Return Home
          </Link>
        </div>
      </div>
    </section>
  );
}
