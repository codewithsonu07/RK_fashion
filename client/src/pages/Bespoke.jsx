import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ImagePlus, X } from 'lucide-react';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import { Field, FieldError } from '../components/Field';
import { bespokeOptions as O, home } from '../data/site';
import { useProducts } from '../store/products';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';

const PROCESS = [
  { title: 'Share Your Vision', text: 'Tell us about the occasion, the look you love and send your inspiration.' },
  { title: 'Design Consultation', text: 'Meet Rohit Kumar’s design team in-store or online to shape the concept.' },
  { title: 'Measurements & Fabric', text: 'Choose fabrics and embroidery samples; we take precise measurements.' },
  { title: 'Design Approval', text: 'Approve the final sketch, details and quotation before work begins.' },
  { title: 'Final Crafting', text: 'Our karigars cut, embroider and construct your piece, with fittings.' },
  { title: 'Delivery', text: 'Your finished garment is pressed, packed and delivered to you.' },
];

const STEPS = ['Your Outfit', 'Design Details', 'Inspiration', 'Measurements', 'Consultation & Contact', 'Review'];

const MAX_FILES = 6;
const MAX_MB = 8;

const initial = {
  gender: '',
  category: '',
  garment: '',
  fabric: '',
  colour: '',
  embellishments: [],
  designNotes: '',
  description: '',
  unit: 'in',
  takeAtAppointment: false,
  measurements: {},
  appointmentPreference: '',
  eventDate: '',
  budget: '',
  name: '',
  email: '',
  phone: '',
  city: '',
  consent: false,
};

export default function Bespoke() {
  usePageTitle('The Bespoke Studio', 'Design a personalised outfit with RK FASHIONS — share your vision, choose fabrics and book a consultation with designer Rohit Kumar.');
  const formRef = useRef(null);
  return (
    <>
      <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-ink text-ivory">
        <Img src={home.bespoke.image} alt="Hand-embroidered garments in the RK FASHIONS atelier" width={1800} eager position="50% 40%" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
        <div className="container-luxe relative z-10 pb-16 sm:pb-24">
          <motion.p className="eyebrow text-champagne" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            RK FASHIONS
          </motion.p>
          <motion.h1
            className="mt-5 max-w-3xl text-[48px] leading-[0.98] sm:text-[84px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            THE BESPOKE STUDIO
          </motion.h1>
          <p className="mt-6 max-w-xl font-serif text-2xl italic text-ivory/90">Not just worn. Personally created.</p>
          <button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="btn-gold mt-10">
            Begin Your Design
          </button>
        </div>
      </section>

      <section className="container-luxe py-24 sm:py-28" aria-label="The bespoke process">
        <SectionHeading eyebrow="The Process" title="Six Steps to Your Own Design" text="Every bespoke piece follows the same considered journey — from first idea to final stitch." />
        <ol className="mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={(i % 3) * 0.08} className="bg-ivory p-8 sm:p-10">
              <span className="font-serif text-5xl text-champagne">0{i + 1}</span>
              <p className="label-caps mt-6">Step {i + 1}</p>
              <h3 className="mt-2 text-[26px]">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section ref={formRef} className="scroll-mt-28 bg-beige py-20 sm:py-28" aria-label="Bespoke design enquiry">
        <div className="container-luxe">
          <SectionHeading eyebrow="Design Enquiry" title="Share Your Vision" text="There is no price on a dream until we understand it. Rohit Kumar’s team will review your brief and share a personalised quotation — nothing is charged now." />
          <div className="mx-auto mt-14 max-w-4xl">
            <BespokeForm />
          </div>
        </div>
      </section>
    </>
  );
}

function BespokeForm() {
  const [params] = useSearchParams();
  const { products } = useProducts();
  const refProduct = useMemo(() => products.find((p) => p.slug === params.get('product')), [products, params]);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initial);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submit, setSubmit] = useState({ status: 'idle', error: null, result: null });
  const topRef = useRef(null);

  // Pre-fill from a product's "Request Customisation" link.
  useEffect(() => {
    if (refProduct && !data.gender) {
      setData((d) => ({
        ...d,
        gender: refProduct.gender,
        description: `I would like a customised version of the ${refProduct.name}. `,
      }));
    }
  }, [refProduct, data.gender]);

  const set = (key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const groups = data.gender ? O.categories[data.gender] : {};

  const validateStep = (i) => {
    const e = {};
    if (i === 0) {
      if (!data.gender) e.gender = 'Choose who the outfit is for.';
      if (!data.category) e.category = 'Choose an outfit category.';
      if (!data.garment) e.garment = 'Choose a garment type.';
    }
    if (i === 2 && data.description.trim().length < 20) e.description = 'Please describe your outfit in a little more detail (at least 20 characters).';
    if (i === 4) {
      if (!data.appointmentPreference) e.appointmentPreference = 'Choose how you would like to consult.';
      if (!data.name.trim()) e.name = 'Please enter your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address.';
      if (!/^[+()\-\s\d]{8,20}$/.test(data.phone)) e.phone = 'Enter a valid phone number.';
      if (!data.consent) e.consent = 'Please agree so we can contact you about your enquiry.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (next) => {
    if (next > step && !validateStep(step)) return;
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addFiles = (list) => {
    const incoming = Array.from(list).filter((f) => /^image\/(jpeg|png|webp|heic)$/.test(f.type));
    const tooBig = incoming.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const ok = incoming.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    const next = [...files, ...ok.map((f) => ({ file: f, url: URL.createObjectURL(f) }))].slice(0, MAX_FILES);
    setFiles(next);
    setErrors((e) => ({
      ...e,
      files: tooBig.length
        ? `${tooBig.length} image(s) exceed ${MAX_MB} MB and were skipped.`
        : files.length + ok.length > MAX_FILES
          ? `You can upload up to ${MAX_FILES} images.`
          : incoming.length < list.length
            ? 'Only JPG, PNG, WEBP or HEIC images are accepted.'
            : undefined,
    }));
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(files[i].url);
    setFiles(files.filter((_, idx) => idx !== i));
  };

  const send = async () => {
    for (const i of [0, 2, 4]) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setSubmit({ status: 'loading', error: null, result: null });
    const fd = new FormData();
    const { measurements, embellishments, consent, ...rest } = data;
    Object.entries(rest).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append('embellishments', embellishments.join(', '));
    if (refProduct) fd.append('referenceProduct', refProduct.slug);
    if (!data.takeAtAppointment) Object.entries(measurements).forEach(([k, v]) => v && fd.append(`m_${k}`, v));
    files.forEach((f) => fd.append('inspiration', f.file));
    try {
      const result = await api.submitEnquiry(fd);
      setSubmit({ status: 'done', error: null, result });
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setSubmit({ status: 'error', error: err, result: null });
      if (err.fields && Object.keys(err.fields).length) setErrors(err.fields);
    }
  };

  if (submit.status === 'done') {
    return (
      <div ref={topRef} className="scroll-mt-32 bg-ivory px-6 py-16 text-center sm:px-16" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-champagne text-gold-dark">
          <Check size={26} strokeWidth={1.25} />
        </span>
        <p className="eyebrow mt-8">Enquiry Received</p>
        <h3 className="mt-4 text-[36px] sm:text-[44px]">Thank you, {data.name.split(' ')[0]}.</h3>
        <p className="mt-6 text-[14px] text-muted">Your reference number</p>
        <p className="mt-2 font-serif text-3xl tracking-[0.12em]">{submit.result.reference}</p>
        <p className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-charcoal">
          Your design brief has been saved and shared with the RK FASHIONS design team. We will review it and contact you within 2 working days to arrange your{' '}
          {data.appointmentPreference === 'online' ? 'online consultation' : data.appointmentPreference === 'in-store' ? 'studio consultation' : 'call'} and share a personalised quotation.
        </p>
        <p className="mx-auto mt-4 max-w-lg text-[13px] text-muted">
          {submit.result.emailed
            ? `A confirmation email has been sent to ${data.email}.`
            : 'Please keep your reference number for your records — email confirmations are not yet enabled.'}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/appointment" className="btn-dark">
            Book a Consultation Slot
          </Link>
          <Link to="/collections" className="btn-outline">
            Explore Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-32 bg-ivory">
      {/* Progress */}
      <ol className="grid grid-cols-6 border-b border-line">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i < step && go(i)}
              disabled={i > step}
              className={`flex w-full flex-col items-center gap-2 px-1 py-5 text-center transition-colors ${i <= step ? 'text-ink' : 'text-muted/60'}`}
              aria-current={i === step ? 'step' : undefined}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] ${i < step ? 'border-ink bg-ink text-ivory' : i === step ? 'border-ink' : 'border-sand'}`}>
                {i < step ? <Check size={14} strokeWidth={1.5} /> : i + 1}
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.16em] md:block">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="h-px bg-line">
        <motion.div className="h-px bg-champagne" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.6 }} />
      </div>

      <div className="px-6 py-10 sm:px-12 sm:py-14">
        <p className="label-caps text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="mt-2 text-[32px]">{STEPS[step]}</h3>
        {refProduct && step === 0 && (
          <p className="mt-4 bg-cream px-4 py-3 text-[13px]">
            Customising: <strong className="font-normal">{refProduct.name}</strong>
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }} className="mt-10">
            {step === 0 && (
              <div className="space-y-10">
                <ChoiceGroup label="This outfit is for" error={errors.gender}>
                  {[
                    ['women', 'Women'],
                    ['men', 'Men'],
                  ].map(([v, l]) => (
                    <Choice key={v} selected={data.gender === v} onClick={() => {
                        setData((d) => ({ ...d, gender: v, category: '', garment: '', measurements: {} }));
                        setErrors({});
                      }}
                      large
                    >
                      {l}
                    </Choice>
                  ))}
                </ChoiceGroup>
                {data.gender && (
                  <ChoiceGroup label="Outfit category" error={errors.category}>
                    {Object.keys(groups).map((g) => (
                      <Choice key={g} selected={data.category === g} onClick={() => setData((d) => ({ ...d, category: g, garment: '' }))}>
                        {g}
                      </Choice>
                    ))}
                  </ChoiceGroup>
                )}
                {data.category && (
                  <ChoiceGroup label="Garment type" error={errors.garment}>
                    {groups[data.category].map((g) => (
                      <Choice key={g} selected={data.garment === g} onClick={() => set('garment', g)}>
                        {g}
                      </Choice>
                    ))}
                  </ChoiceGroup>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-10">
                <ChoiceGroup label="Preferred fabric">
                  {O.fabrics.map((f) => (
                    <Choice key={f} selected={data.fabric === f} onClick={() => set('fabric', data.fabric === f ? '' : f)}>
                      {f}
                    </Choice>
                  ))}
                </ChoiceGroup>
                <div>
                  <p className="label-caps">
                    Colour <span className="ml-2 normal-case tracking-normal text-muted">{data.colour || 'Optional'}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {O.colours.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => set('colour', data.colour === c.name ? '' : c.name)}
                        aria-pressed={data.colour === c.name}
                        aria-label={c.name}
                        title={c.name}
                        className={`h-10 w-10 rounded-full border border-sand transition-all ${data.colour === c.name ? 'ring-1 ring-ink ring-offset-2 ring-offset-ivory' : 'hover:scale-110'}`}
                        style={{ background: c.hex }}
                      />
                    ))}
                    <Choice selected={data.colour === 'Designer’s choice'} onClick={() => set('colour', data.colour === 'Designer’s choice' ? '' : 'Designer’s choice')}>
                      Designer’s choice
                    </Choice>
                  </div>
                </div>
                <ChoiceGroup label="Embroidery & embellishment (choose any)">
                  {O.embellishments.map((em) => {
                    const on = data.embellishments.includes(em);
                    return (
                      <Choice key={em} selected={on} onClick={() => set('embellishments', on ? data.embellishments.filter((x) => x !== em) : [...data.embellishments, em])}>
                        {em}
                      </Choice>
                    );
                  })}
                </ChoiceGroup>
                <Field label="Design preferences (optional)" hint="Neckline, sleeves, silhouette, dupatta style…">
                  <textarea rows={3} className="field-box" value={data.designNotes} onChange={(e) => set('designNotes', e.target.value)} maxLength={1000} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10">
                <Field label="Describe your desired outfit *" error={errors.description} hint="The occasion, the feeling you want, details you love — the more you share, the better.">
                  <textarea rows={6} className="field-box" value={data.description} onChange={(e) => set('description', e.target.value)} maxLength={3000} aria-invalid={!!errors.description} />
                </Field>
                <div>
                  <p className="label-caps">Inspiration photographs (optional)</p>
                  <p className="mt-2 text-[13px] text-muted">
                    Up to {MAX_FILES} images · JPG, PNG, WEBP or HEIC · {MAX_MB} MB each
                  </p>
                  <label
                    className="mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed border-sand bg-cream px-6 py-10 text-center transition-colors hover:border-gold"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      addFiles(e.dataTransfer.files);
                    }}
                  >
                    <ImagePlus size={28} strokeWidth={1} className="text-gold-dark" />
                    <span className="mt-3 text-[14px]">Drag images here or click to browse</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
                  </label>
                  <FieldError>{errors.files}</FieldError>
                  {files.length > 0 && (
                    <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {files.map((f, i) => (
                        <li key={f.url} className="relative aspect-square bg-beige">
                          <img src={f.url} alt={`Inspiration ${i + 1}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeFile(i)} className="absolute right-1 top-1 bg-ivory/90 p-1" aria-label={`Remove image ${i + 1}`}>
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <label className="flex cursor-pointer items-start gap-3 bg-cream p-5 text-[14px]">
                  <input type="checkbox" checked={data.takeAtAppointment} onChange={(e) => set('takeAtAppointment', e.target.checked)} className="mt-1 accent-ink" />
                  <span>
                    <span className="block">Please take my measurements at the consultation</span>
                    <span className="mt-1 block text-[13px] text-muted">Recommended for bridal and groom outfits. You can skip this step.</span>
                  </span>
                </label>
                {!data.takeAtAppointment && (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="label-caps">Unit</span>
                      {['in', 'cm'].map((u) => (
                        <Choice key={u} selected={data.unit === u} onClick={() => set('unit', u)}>
                          {u === 'in' ? 'Inches' : 'Centimetres'}
                        </Choice>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
                      {O.measurements[data.gender || 'women'].map((k) => (
                        <Field key={k} label={O.measurementLabels[k]}>
                          <input
                            inputMode="decimal"
                            className="field"
                            placeholder={data.unit}
                            value={data.measurements[k] || ''}
                            onChange={(e) => set('measurements', { ...data.measurements, [k]: e.target.value.replace(/[^\d.]/g, '').slice(0, 6) })}
                          />
                        </Field>
                      ))}
                    </div>
                    <p className="text-[13px] text-muted">All measurements are optional and will be verified by our master tailor before cutting.</p>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10">
                <ChoiceGroup label="Consultation preference *" error={errors.appointmentPreference}>
                  {[
                    ['in-store', 'In-store consultation'],
                    ['online', 'Online video consultation'],
                    ['call-back', 'Please call me first'],
                  ].map(([v, l]) => (
                    <Choice key={v} selected={data.appointmentPreference === v} onClick={() => set('appointmentPreference', v)}>
                      {l}
                    </Choice>
                  ))}
                </ChoiceGroup>
                <div className="grid gap-8 sm:grid-cols-2">
                  <Field label="Event date (optional)">
                    <input type="date" className="field" value={data.eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set('eventDate', e.target.value)} />
                  </Field>
                  <Field label="Approximate budget (optional)">
                    <select className="field" value={data.budget} onChange={(e) => set('budget', e.target.value)}>
                      <option value="">Prefer to discuss</option>
                      <option>Under ₹50,000</option>
                      <option>₹50,000 – ₹1,50,000</option>
                      <option>₹1,50,000 – ₹3,00,000</option>
                      <option>Above ₹3,00,000</option>
                    </select>
                  </Field>
                  <Field label="Full name *" error={errors.name}>
                    <input className="field" autoComplete="name" value={data.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
                  </Field>
                  <Field label="Email *" error={errors.email}>
                    <input type="email" className="field" autoComplete="email" value={data.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
                  </Field>
                  <Field label="Phone / WhatsApp *" error={errors.phone}>
                    <input type="tel" className="field" autoComplete="tel" placeholder="+91" value={data.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
                  </Field>
                  <Field label="City (optional)">
                    <input className="field" autoComplete="address-level2" value={data.city} onChange={(e) => set('city', e.target.value)} />
                  </Field>
                </div>
                <div>
                  <label className="flex cursor-pointer items-start gap-3 text-[13px] text-charcoal">
                    <input type="checkbox" checked={data.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 accent-ink" />
                    <span>
                      I agree that RK FASHIONS may store my details, measurements and images to respond to this enquiry, as described in the{' '}
                      <Link to="/pages/privacy" className="underline underline-offset-4">
                        privacy policy
                      </Link>
                      .
                    </span>
                  </label>
                  <FieldError>{errors.consent}</FieldError>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <dl className="divide-y divide-line border-y border-line text-[14px]">
                  <Row label="For" value={data.gender === 'women' ? 'Women' : 'Men'} onEdit={() => go(0)} />
                  <Row label="Outfit" value={`${data.garment} · ${data.category}`} onEdit={() => go(0)} />
                  {refProduct && <Row label="Based on" value={refProduct.name} onEdit={() => go(0)} />}
                  <Row label="Fabric" value={data.fabric || '—'} onEdit={() => go(1)} />
                  <Row label="Colour" value={data.colour || '—'} onEdit={() => go(1)} />
                  <Row label="Embellishment" value={data.embellishments.join(', ') || '—'} onEdit={() => go(1)} />
                  <Row label="Description" value={data.description} onEdit={() => go(2)} />
                  <Row label="Inspiration" value={files.length ? `${files.length} image(s)` : '—'} onEdit={() => go(2)} />
                  <Row
                    label="Measurements"
                    value={
                      data.takeAtAppointment
                        ? 'To be taken at consultation'
                        : Object.entries(data.measurements)
                            .filter(([, v]) => v)
                            .map(([k, v]) => `${O.measurementLabels[k]} ${v}${data.unit}`)
                            .join(', ') || '—'
                    }
                    onEdit={() => go(3)}
                  />
                  <Row
                    label="Consultation"
                    value={{ 'in-store': 'In-store', online: 'Online', 'call-back': 'Call me first' }[data.appointmentPreference]}
                    onEdit={() => go(4)}
                  />
                  <Row label="Contact" value={`${data.name} · ${data.email} · ${data.phone}`} onEdit={() => go(4)} />
                </dl>
                <p className="mt-8 bg-cream p-5 text-[13px] leading-relaxed text-charcoal">
                  <strong className="font-normal">About pricing:</strong> bespoke pieces are priced individually. Submitting this enquiry is free and does not commit you to anything —
                  the designer will review your brief and send a quotation for your approval.
                </p>
                {submit.status === 'error' && (
                  <p className="mt-6 border border-error/40 bg-error/5 p-4 text-[14px] text-error" role="alert">
                    {submit.error.message}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-8">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="label-caps flex items-center gap-2 py-3 hover:text-gold-dark">
              <ArrowLeft size={14} strokeWidth={1.25} /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn-dark">
              {step === 3 && data.takeAtAppointment ? 'Continue' : 'Next'} <ArrowRight size={14} strokeWidth={1.25} />
            </button>
          ) : (
            <button type="button" onClick={send} disabled={submit.status === 'loading'} className="btn-dark">
              {submit.status === 'loading' ? 'Submitting…' : 'Submit Design Enquiry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceGroup({ label, error, children }) {
  return (
    <fieldset>
      <legend className="label-caps">{label}</legend>
      <div className="mt-4 flex flex-wrap gap-3">{children}</div>
      <FieldError>{error}</FieldError>
    </fieldset>
  );
}

function Choice({ selected, onClick, children, large = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`border transition-colors ${large ? 'min-w-36 px-8 py-5 font-serif text-xl' : 'px-4 py-2.5 text-[13px]'} ${
        selected ? 'border-ink bg-ink text-ivory' : 'border-sand bg-ivory hover:border-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, onEdit }) {
  return (
    <div className="grid grid-cols-[120px_1fr_auto] gap-4 py-4 sm:grid-cols-[160px_1fr_auto]">
      <dt className="label-caps pt-0.5 text-muted">{label}</dt>
      <dd className="whitespace-pre-line break-words">{value}</dd>
      <button type="button" onClick={onEdit} className="text-[12px] text-muted underline underline-offset-4 hover:text-ink">
        Edit
      </button>
    </div>
  );
}
