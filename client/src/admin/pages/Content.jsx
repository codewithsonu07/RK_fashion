import { Plus, Trash2 } from 'lucide-react';
import { Btn, ErrorNote, ImageListEditor, Input, PageHeader, Panel, Toggle } from '../ui';
import { useContentEditor } from '../useContentEditor';
import { collections } from '../../data/site';

export default function Content() {
  const { draft, update, save, state } = useContentEditor(['brand', 'home', 'testimonials', 'instagramGallery', 'about', 'infoPages']);
  const { brand, home, about } = draft;
  const single = (src) => (src ? [src] : []);

  return (
    <>
      <PageHeader
        title="Homepage & Content"
        text="Banners, campaign images, testimonials, contact details and the designer page."
        actions={
          <>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center px-3 text-[12px] underline underline-offset-4">
              Preview site
            </a>
            <Btn onClick={save} disabled={state.busy || !state.dirty}>
              {state.busy ? 'Saving…' : 'Save Changes'}
            </Btn>
          </>
        }
      />
      {state.msg && <p className="mb-4 text-[13px] text-gold-dark" role="status">{state.msg}</p>}
      <ErrorNote error={state.error} />

      <div className="mt-4 space-y-6">
        <Panel title="Announcement bar">
          <Input value={brand.announcement} onChange={(e) => update((d) => (d.brand.announcement = e.target.value))} />
        </Panel>

        <Panel title="Hero campaign">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Small heading" value={home.hero.eyebrow} onChange={(e) => update((d) => (d.home.hero.eyebrow = e.target.value))} />
            <Input label="Main heading" value={home.hero.title} onChange={(e) => update((d) => (d.home.hero.title = e.target.value))} />
            <Input label="Subheading" value={home.hero.subtitle} onChange={(e) => update((d) => (d.home.hero.subtitle = e.target.value))} />
          </div>
          <p className="label-caps mb-2 mt-6 text-muted">Hero images (left · centre · right — centre shows on phones)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {home.hero.panels.map((p, i) => (
              <div key={i} className="space-y-2">
                <ImageListEditor single images={single(p.image)} onChange={(v) => update((d) => (d.home.hero.panels[i].image = v[0] || ''))} />
                <Input placeholder="Image description (for accessibility)" value={p.alt} onChange={(e) => update((d) => (d.home.hero.panels[i].alt = e.target.value))} />
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Shop by gender images">
            <div className="grid grid-cols-2 gap-4">
              {home.gender.map((g, i) => (
                <div key={g.label}>
                  <p className="label-caps mb-2 text-muted">{g.label}</p>
                  <ImageListEditor single images={single(g.image)} onChange={(v) => update((d) => (d.home.gender[i].image = v[0] || ''))} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Signature collections (4 on homepage)">
            <div className="grid grid-cols-2 gap-3">
              {home.signature.map((slug, i) => (
                <Input key={i} as="select" value={slug} onChange={(e) => update((d) => (d.home.signature[i] = e.target.value))} aria-label={`Signature collection ${i + 1}`}>
                  {collections.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title}
                    </option>
                  ))}
                </Input>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted">Collection images and titles are edited in Categories & Collections.</p>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Bespoke banner">
            <div className="space-y-4">
              <Input label="Heading" value={home.bespoke.title} onChange={(e) => update((d) => (d.home.bespoke.title = e.target.value))} />
              <Input label="Text" as="textarea" rows={2} value={home.bespoke.text} onChange={(e) => update((d) => (d.home.bespoke.text = e.target.value))} />
              <ImageListEditor single images={single(home.bespoke.image)} onChange={(v) => update((d) => (d.home.bespoke.image = v[0] || ''))} />
            </div>
          </Panel>
          <Panel title="Appointment banner">
            <div className="space-y-4">
              <Input label="Heading" value={home.appointment.title} onChange={(e) => update((d) => (d.home.appointment.title = e.target.value))} />
              <Input label="Text" as="textarea" rows={2} value={home.appointment.text} onChange={(e) => update((d) => (d.home.appointment.text = e.target.value))} />
              <ImageListEditor single images={single(home.appointment.image)} onChange={(v) => update((d) => (d.home.appointment.image = v[0] || ''))} />
            </div>
          </Panel>
        </div>

        <Panel title="Customer testimonials">
          <div className="space-y-4">
            {draft.testimonials.map((t, i) => (
              <div key={i} className="grid gap-3 border border-line p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <Input label="Quote" as="textarea" rows={2} value={t.quote} onChange={(e) => update((d) => (d.testimonials[i].quote = e.target.value))} />
                <Input label="Name" value={t.name} onChange={(e) => update((d) => (d.testimonials[i].name = e.target.value))} />
                <Input label="Detail" value={t.detail} onChange={(e) => update((d) => (d.testimonials[i].detail = e.target.value))} placeholder="e.g. Bridal lehenga" />
                <div className="flex flex-col justify-between gap-2">
                  <button type="button" onClick={() => update((d) => d.testimonials.splice(i, 1))} className="self-end p-1 text-muted hover:text-error" aria-label="Remove testimonial">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="sm:col-span-4">
                  <Toggle label="Sample only (not shown on the live website)" checked={!!t.sample} onChange={(v) => update((d) => (d.testimonials[i].sample = v))} />
                </div>
              </div>
            ))}
            <Btn small variant="outline" onClick={() => update((d) => d.testimonials.push({ quote: '', name: '', detail: '', sample: false }))}>
              <Plus size={12} /> Add testimonial
            </Btn>
            <p className="text-[12px] text-muted">Only publish genuine reviews that customers have agreed to share.</p>
          </div>
        </Panel>

        <Panel title="Instagram gallery (6 images)">
          <ImageListEditor images={draft.instagramGallery} max={6} onChange={(v) => update((d) => (d.instagramGallery = v))} />
        </Panel>

        <Panel title="Contact details & social links">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['email', 'Studio email'],
              ['phone', 'Phone'],
              ['whatsapp', 'WhatsApp number'],
              ['hours', 'Opening hours'],
            ].map(([k, l]) => (
              <Input key={k} label={l} value={brand.contact[k] || ''} onChange={(e) => update((d) => (d.brand.contact[k] = e.target.value))} />
            ))}
            <Input label="Studio address" as="textarea" rows={2} value={brand.contact.address || ''} onChange={(e) => update((d) => (d.brand.contact.address = e.target.value))} className="sm:col-span-2" />
            {['instagram', 'facebook', 'youtube', 'pinterest'].map((k) => (
              <Input key={k} label={`${k[0].toUpperCase()}${k.slice(1)} URL`} value={brand.social[k] || ''} onChange={(e) => update((d) => (d.brand.social[k] = e.target.value))} placeholder="https://" />
            ))}
            <Input label="Instagram handle" value={brand.instagramHandle} onChange={(e) => update((d) => (d.brand.instagramHandle = e.target.value))} />
          </div>
          <p className="mt-3 text-[12px] text-muted">Empty fields are hidden on the website.</p>
        </Panel>

        <Panel title="Policy & information pages">
          <div className="space-y-6">
            {Object.entries(draft.infoPages).map(([slug, page]) => (
              <div key={slug} className="grid gap-3 border border-line p-4 lg:grid-cols-[220px_1fr]">
                <div>
                  <Input label="Page title" value={page.title} onChange={(e) => update((d) => (d.infoPages[slug].title = e.target.value))} />
                  <a href={`/pages/${slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-muted underline underline-offset-4">
                    /pages/{slug}
                  </a>
                </div>
                <Input
                  label="Text"
                  as="textarea"
                  rows={5}
                  value={page.body.join('\n\n')}
                  onChange={(e) => update((d) => (d.infoPages[slug].body = e.target.value.split(/\n\s*\n/)))}
                  hint="Leave a blank line between paragraphs. Remove any [bracketed] placeholders before launch."
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="About the Designer page">
          <div className="grid gap-6 lg:grid-cols-[140px_1fr]">
            <div>
              <p className="label-caps mb-2 text-muted">Portrait</p>
              <ImageListEditor single images={single(about.portrait)} onChange={(v) => update((d) => (d.about.portrait = v[0] || null))} />
            </div>
            <div className="space-y-4">
              <Input label="Introduction" as="textarea" rows={4} value={about.intro} onChange={(e) => update((d) => (d.about.intro = e.target.value))} />
              <Input label="Creative inspiration" as="textarea" rows={3} value={about.inspiration} onChange={(e) => update((d) => (d.about.inspiration = e.target.value))} />
              <div>
                <p className="label-caps mb-2 text-muted">Brand journey</p>
                <div className="space-y-2">
                  {about.journey.map((j, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={j.year} onChange={(e) => update((d) => (d.about.journey[i].year = e.target.value))} className="field-box w-24 py-1.5 text-[14px]" aria-label="Year" />
                      <input value={j.text} onChange={(e) => update((d) => (d.about.journey[i].text = e.target.value))} className="field-box flex-1 py-1.5 text-[14px]" aria-label="Milestone" />
                      <button type="button" onClick={() => update((d) => d.about.journey.splice(i, 1))} className="p-1 text-muted hover:text-error" aria-label="Remove milestone">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <Btn small variant="ghost" className="mt-2" onClick={() => update((d) => d.about.journey.push({ year: '', text: '' }))}>
                  <Plus size={12} /> Add milestone
                </Btn>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
