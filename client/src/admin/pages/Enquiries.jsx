import { useMemo, useState } from 'react';
import { admin } from '../api';
import { assetUrl } from '../../lib/config';
import { Badge, Btn, Drawer, ErrorNote, Input, Loading, PageHeader, dateTime, useLoad } from '../ui';
import { bespokeOptions } from '../../data/site';
import { formatPrice } from '../../lib/format';

export const ENQUIRY_STATUS = {
  new: { label: 'New', tone: 'gold' },
  'in-review': { label: 'In review', tone: 'grey' },
  'consultation-scheduled': { label: 'Consultation scheduled', tone: 'grey' },
  quoted: { label: 'Quotation sent', tone: 'ink' },
  approved: { label: 'Design approved', tone: 'green' },
  'in-production': { label: 'In production', tone: 'green' },
  delivered: { label: 'Delivered', tone: 'green' },
  closed: { label: 'Closed', tone: 'grey' },
};
const PREF = { 'in-store': 'In-store consultation', online: 'Online consultation', 'call-back': 'Call back first' };

export default function Enquiries() {
  const { status, data, error, setData } = useLoad(() => admin.enquiries());
  const [filter, setFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => (data?.enquiries || []).filter((e) => !filter || e.status === filter), [data, filter]);
  const open = data?.enquiries.find((e) => e._id === openId);

  return (
    <>
      <PageHeader title="Bespoke Enquiries" text="Review design briefs and inspiration images, then send a quotation." />
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field-box mb-5 w-auto py-2 text-[13px]" aria-label="Filter by status">
        <option value="">All statuses</option>
        {Object.entries(ENQUIRY_STATUS).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      {status === 'loading' && <Loading />}
      <ErrorNote error={error} />
      {data && (
        <div className="grid gap-3">
          {list.map((e) => (
            <button key={e._id} type="button" onClick={() => setOpenId(e._id)} className="flex flex-wrap items-center gap-4 border border-line bg-white/60 p-4 text-left transition-colors hover:border-ink">
              <div className="min-w-48 flex-1">
                <p className="font-serif text-xl">
                  {e.garment} <span className="text-[13px] text-muted">· {e.gender === 'women' ? 'Women' : 'Men'}</span>
                </p>
                <p className="text-[12px] text-muted">
                  {e.reference} · {e.contact.name} · {dateTime(e.createdAt)}
                </p>
              </div>
              {e.inspirationImages?.length > 0 && <span className="text-[12px] text-muted">{e.inspirationImages.length} image(s)</span>}
              <Badge tone={ENQUIRY_STATUS[e.status].tone}>{ENQUIRY_STATUS[e.status].label}</Badge>
            </button>
          ))}
          {list.length === 0 && <p className="p-8 text-center text-[13px] text-muted">No enquiries yet.</p>}
        </div>
      )}
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `${open.reference} — ${open.garment}` : ''} width="max-w-2xl">
        {open && <EnquiryPanel e={open} onSaved={(u) => setData({ enquiries: data.enquiries.map((x) => (x._id === u._id ? u : x)) })} />}
      </Drawer>
    </>
  );
}

function EnquiryPanel({ e, onSaved }) {
  const [status, setStatus] = useState(e.status);
  const [quote, setQuote] = useState({ amount: e.quote?.amount || '', notes: e.quote?.notes || '' });
  const [state, setState] = useState({ busy: false, error: null, msg: '' });
  const m = e.measurements || {};
  const values = Object.entries(m.values || {});

  const save = async () => {
    setState({ busy: true, error: null, msg: '' });
    try {
      const body = { status };
      if (quote.amount) {
        body.quote = { amount: Number(quote.amount), notes: quote.notes };
        if (status === e.status && ['new', 'in-review', 'consultation-scheduled'].includes(status)) body.status = 'quoted';
      }
      const { enquiry, emailed } = await admin.updateEnquiry(e._id, body);
      onSaved(enquiry);
      setStatus(enquiry.status);
      const quoteChanged = body.quote && (body.quote.amount !== e.quote?.amount || body.quote.notes !== (e.quote?.notes || ''));
      setState({
        busy: false,
        error: null,
        msg: !quoteChanged ? 'Saved.' : emailed ? `Saved — quotation emailed to ${e.contact.email}.` : 'Saved. Email is not set up, so please send the quotation to the client directly.',
      });
    } catch (error) {
      setState({ busy: false, error, msg: '' });
    }
  };

  const Row = ({ label, children }) =>
    children ? (
      <div className="grid grid-cols-[150px_1fr] gap-3 py-2">
        <dt className="label-caps pt-0.5 text-muted">{label}</dt>
        <dd>{children}</dd>
      </div>
    ) : null;

  return (
    <div className="space-y-8 text-[14px]">
      <dl className="divide-y divide-line border-y border-line">
        <Row label="Client">
          {e.contact.name}
          <span className="block text-muted">
            <a href={`mailto:${e.contact.email}`} className="underline underline-offset-4">
              {e.contact.email}
            </a>{' '}
            ·{' '}
            <a href={`tel:${e.contact.phone.replace(/\s/g, '')}`} className="underline underline-offset-4">
              {e.contact.phone}
            </a>
            {e.contact.city && ` · ${e.contact.city}`}
          </span>
        </Row>
        <Row label="Outfit">
          {e.garment} · {e.category} · {e.gender === 'women' ? 'Women' : 'Men'}
        </Row>
        <Row label="Based on">{e.referenceProduct && <a href={`/product/${e.referenceProduct}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">{e.referenceProduct}</a>}</Row>
        <Row label="Fabric">{e.fabric}</Row>
        <Row label="Colour">{e.colour}</Row>
        <Row label="Embellishment">{e.embellishments?.join(', ')}</Row>
        <Row label="Design notes">{e.designNotes}</Row>
        <Row label="Description">
          <span className="whitespace-pre-line">{e.description}</span>
        </Row>
        <Row label="Event date">{e.eventDate}</Row>
        <Row label="Budget">{e.budget}</Row>
        <Row label="Consultation">{PREF[e.appointmentPreference]}</Row>
        <Row label="Measurements">
          {m.takeAtAppointment
            ? 'To be taken at consultation'
            : values.length
              ? values.map(([k, v]) => `${bespokeOptions.measurementLabels[k] || k}: ${v}${m.unit}`).join(' · ')
              : '—'}
        </Row>
      </dl>

      {e.inspirationImages?.length > 0 && (
        <div>
          <p className="label-caps mb-3 text-muted">Inspiration images</p>
          <div className="grid grid-cols-3 gap-2">
            {e.inspirationImages.map((im) => (
              <a key={im.url} href={assetUrl(im.url)} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden bg-beige">
                <img src={assetUrl(im.url)} alt={im.name || 'Inspiration'} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 border border-line bg-white/60 p-5">
        <p className="label-caps">Status & quotation</p>
        <Input label="Status" as="select" value={status} onChange={(ev) => setStatus(ev.target.value)}>
          {Object.entries(ENQUIRY_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Input>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Input label="Quotation (₹)" type="number" min="1" value={quote.amount} onChange={(ev) => setQuote({ ...quote, amount: ev.target.value })} />
          <Input label="Quotation notes" value={quote.notes} onChange={(ev) => setQuote({ ...quote, notes: ev.target.value })} placeholder="Inclusions, timeline, fittings…" />
        </div>
        {e.quote?.sentAt && (
          <p className="text-[12px] text-muted">
            Current quotation {formatPrice(e.quote.amount)} · saved {dateTime(e.quote.sentAt)}. The client sees it in My Account if they submitted while signed in.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Btn onClick={save} disabled={state.busy}>
            {state.busy ? 'Saving…' : 'Save'}
          </Btn>
          {state.msg && <span className="text-[13px] text-gold-dark">{state.msg}</span>}
        </div>
        <ErrorNote error={state.error} />
      </div>
    </div>
  );
}
