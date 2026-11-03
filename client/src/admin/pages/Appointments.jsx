import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { admin } from '../api';
import { Badge, Btn, ErrorNote, Input, Loading, PageHeader, Panel, useLoad } from '../ui';
import { appointmentTypes } from '../../data/site';
import { formatDate, formatTime } from '../../lib/format';

const STATUS = {
  requested: { label: 'Awaiting confirmation', tone: 'gold' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  rejected: { label: 'Declined', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
  completed: { label: 'Completed', tone: 'grey' },
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export default function Appointments() {
  const { status, data, error, setData } = useLoad(() => admin.appointments());
  const [view, setView] = useState('upcoming');

  const list = useMemo(() => {
    const all = data?.appointments || [];
    if (view === 'upcoming') return all.filter((a) => a.date >= today() && ['requested', 'confirmed'].includes(a.status));
    if (view === 'requested') return all.filter((a) => a.status === 'requested');
    return [...all].reverse();
  }, [data, view]);

  const replace = (a) => setData({ appointments: data.appointments.map((x) => (x._id === a._id ? a : x)) });

  return (
    <>
      <PageHeader title="Appointments" text="Accept, decline or reschedule consultation requests, and set the studio's bookable hours." />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-5 flex gap-2" role="tablist">
            {[
              ['upcoming', 'Upcoming'],
              ['requested', 'To confirm'],
              ['all', 'All'],
            ].map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`border px-4 py-2 text-[12px] ${view === k ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}>
                {l}
              </button>
            ))}
          </div>
          {status === 'loading' && <Loading />}
          <ErrorNote error={error} />
          {data && (
            <div className="space-y-3">
              {list.map((a) => (
                <AppointmentCard key={a._id} a={a} onSaved={replace} />
              ))}
              {list.length === 0 && <p className="border border-line bg-white/60 p-8 text-center text-[13px] text-muted">Nothing here.</p>}
            </div>
          )}
        </div>
        <StudioHours />
      </div>
    </>
  );
}

function AppointmentCard({ a, onSaved }) {
  const [resched, setResched] = useState(false);
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState(a.time);
  const [state, setState] = useState({ busy: false, error: null });

  const update = async (body) => {
    setState({ busy: true, error: null });
    try {
      const { appointment } = await admin.updateAppointment(a._id, body);
      onSaved(appointment);
      setResched(false);
      setState({ busy: false, error: null });
    } catch (error) {
      setState({ busy: false, error });
    }
  };

  return (
    <div className="border border-line bg-white/60 p-5 text-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl">
            {formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(a.time)}
          </p>
          <p className="text-muted">
            {appointmentTypes.find((t) => t.value === a.type)?.label} · {a.gender === 'women' ? 'Women' : 'Men'} · {a.reference}
          </p>
        </div>
        <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
      </div>
      <p className="mt-3">
        {a.name} ·{' '}
        <a href={`tel:${a.phone.replace(/\s/g, '')}`} className="underline underline-offset-4">
          {a.phone}
        </a>{' '}
        ·{' '}
        <a href={`mailto:${a.email}`} className="underline underline-offset-4">
          {a.email}
        </a>
      </p>
      {(a.requirements || a.message || a.eventDate) && (
        <p className="mt-2 whitespace-pre-line text-[13px] text-muted">
          {a.eventDate && `Event: ${a.eventDate}. `}
          {a.requirements} {a.message}
        </p>
      )}
      {resched && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Input label="New date" type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} />
          <Input label="New time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Btn small onClick={() => update({ date, time })} disabled={state.busy}>
            Save
          </Btn>
          <Btn small variant="ghost" onClick={() => setResched(false)}>
            Cancel
          </Btn>
        </div>
      )}
      {!resched && ['requested', 'confirmed'].includes(a.status) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {a.status === 'requested' && (
            <Btn small onClick={() => update({ status: 'confirmed' })} disabled={state.busy}>
              Accept
            </Btn>
          )}
          <Btn small variant="outline" onClick={() => setResched(true)}>
            Reschedule
          </Btn>
          {a.status === 'requested' ? (
            <Btn small variant="danger" onClick={() => update({ status: 'rejected' })} disabled={state.busy}>
              Decline
            </Btn>
          ) : (
            <>
              <Btn small variant="outline" onClick={() => update({ status: 'completed' })} disabled={state.busy}>
                Mark completed
              </Btn>
              <Btn small variant="danger" onClick={() => update({ status: 'cancelled' })} disabled={state.busy}>
                Cancel
              </Btn>
            </>
          )}
        </div>
      )}
      <div className="mt-3">
        <ErrorNote error={state.error} />
      </div>
    </div>
  );
}

function StudioHours() {
  const { status, data, error, setData } = useLoad(() => admin.studioHours());
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState('');
  const [state, setState] = useState({ busy: false, error: null, msg: '' });
  const h = data?.hours;
  const set = (k, v) => {
    setData({ hours: { ...h, [k]: v } });
    setState((s) => ({ ...s, msg: '' }));
  };

  const save = async () => {
    setState({ busy: true, error: null, msg: '' });
    try {
      const { hours } = await admin.saveStudioHours(h);
      setData({ hours });
      setState({ busy: false, error: null, msg: 'Studio hours saved — the booking page uses them immediately.' });
    } catch (e) {
      setState({ busy: false, error: e, msg: '' });
    }
  };

  return (
    <Panel title="Studio hours & slots">
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {h && (
        <div className="space-y-6 text-[14px]">
          <div>
            <p className="label-caps mb-2 text-muted">Appointment times</p>
            <div className="flex flex-wrap gap-2">
              {[...h.slotTimes].sort().map((t) => (
                <span key={t} className="inline-flex items-center gap-1 border border-sand px-2 py-1 text-[13px]">
                  {formatTime(t)}
                  <button type="button" onClick={() => set('slotTimes', h.slotTimes.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-muted hover:text-error">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="field-box w-36 py-1.5 text-[13px]" aria-label="New appointment time" />
              <Btn small variant="outline" disabled={!newTime} onClick={() => (set('slotTimes', [...new Set([...h.slotTimes, newTime])]), setNewTime(''))}>
                <Plus size={12} /> Add
              </Btn>
            </div>
          </div>
          <div>
            <p className="label-caps mb-2 text-muted">Weekly closed days</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d, i) => {
                const closed = h.closedWeekdays.includes(i);
                return (
                  <button key={d} type="button" aria-pressed={closed} onClick={() => set('closedWeekdays', closed ? h.closedWeekdays.filter((x) => x !== i) : [...h.closedWeekdays, i])} className={`w-12 border py-1.5 text-[12px] ${closed ? 'border-ink bg-ink text-ivory' : 'border-sand'}`}>
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[12px] text-muted">Dark = closed.</p>
          </div>
          <div>
            <p className="label-caps mb-2 text-muted">Closed dates (holidays)</p>
            <div className="flex flex-wrap gap-2">
              {h.closedDates.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 border border-sand px-2 py-1 text-[13px]">
                  {formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' })}
                  <button type="button" onClick={() => set('closedDates', h.closedDates.filter((x) => x !== d))} aria-label={`Remove ${d}`} className="text-muted hover:text-error">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {h.closedDates.length === 0 && <span className="text-[13px] text-muted">None</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <input type="date" value={newDate} min={today()} onChange={(e) => setNewDate(e.target.value)} className="field-box w-44 py-1.5 text-[13px]" aria-label="New closed date" />
              <Btn small variant="outline" disabled={!newDate} onClick={() => (set('closedDates', [...new Set([...h.closedDates, newDate])]), setNewDate(''))}>
                <Plus size={12} /> Add
              </Btn>
            </div>
          </div>
          <Input label="Booking window (days ahead)" type="number" min="1" max="365" value={h.bookingWindowDays} onChange={(e) => set('bookingWindowDays', Number(e.target.value))} />
          <div className="flex flex-wrap items-center gap-3">
            <Btn onClick={save} disabled={state.busy}>
              {state.busy ? 'Saving…' : 'Save Hours'}
            </Btn>
            {state.msg && <span className="text-[13px] text-gold-dark">{state.msg}</span>}
          </div>
          <ErrorNote error={state.error} />
          <p className="text-[12px] text-muted">Existing bookings are kept when hours change.</p>
        </div>
      )}
    </Panel>
  );
}
