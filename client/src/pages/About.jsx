import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import { about, brand } from '../data/site';
import { usePageTitle } from '../lib/usePageTitle';

// Text wrapped in [brackets] in data/site.js is a placeholder awaiting the brand's own information.
const isPlaceholder = (s) => /^\[.*\]$/.test(s.trim());

export default function About() {
  usePageTitle('About the Designer', `${brand.designer}, founder of RK FASHIONS — philosophy, craft and the design process.`);
  return (
    <>
      <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-ink text-ivory">
        <Img src={about.hero} alt="Garments in the RK FASHIONS atelier" width={1800} eager position="50% 40%" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
        <div className="container-luxe relative z-10 pb-16 sm:pb-24">
          <p className="eyebrow text-champagne">About the Designer</p>
          <motion.h1 className="mt-5 text-[54px] leading-none sm:text-[96px]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }}>
            {brand.designer}
          </motion.h1>
          <p className="mt-6 font-serif text-2xl italic text-ivory/90">Founder & Creative Director, RK FASHIONS</p>
        </div>
      </section>

      <section className="container-luxe grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden bg-beige">
            {about.portrait ? (
              <Img src={about.portrait} alt={`Portrait of ${brand.designer}`} width={900} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-gold/60 p-8 text-center">
                <span className="font-serif text-7xl text-champagne">RK</span>
                <span className="label-caps mt-6 text-muted">Portrait of {brand.designer}</span>
                <span className="mt-2 text-[12px] text-muted/80">Placeholder — upload via the admin dashboard</span>
              </div>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">The Designer</p>
          <h2 className="mt-6 text-[38px] leading-[1.1] sm:text-[50px]">Clothes Made Around the Person Who Wears Them</h2>
          <span className="mt-8 block h-px w-14 bg-champagne" />
          <p className="mt-8 text-[16px] leading-relaxed text-charcoal">{about.intro}</p>
          <p className="mt-5 text-[16px] leading-relaxed text-charcoal">{about.inspiration}</p>
        </Reveal>
      </section>

      <section className="bg-ink py-24 text-ivory sm:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Fashion Philosophy" title={`“${brand.philosophy}”`} light />
          <div className="mt-16 grid gap-px bg-ivory/10 md:grid-cols-3">
            {about.philosophy.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1} className="bg-ink p-10 text-center">
                <span className="font-serif text-5xl text-champagne">0{i + 1}</span>
                <h3 className="mt-5 text-3xl">{p.title}</h3>
                <p className="mt-4 text-[14px] leading-relaxed text-ivory/70">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-luxe py-24 sm:py-32">
        <SectionHeading eyebrow="The Design Process" title="From Conversation to Couture" />
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {about.process.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08} className="border-t border-ink pt-6">
              <p className="label-caps text-gold">Stage {i + 1}</p>
              <h3 className="mt-3 text-[26px]">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-beige py-24 sm:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Craftsmanship" title="The Hand Behind Every Piece" text="Zardozi, chikankari, gota patti and handwoven silks — techniques passed between generations of artisans, finished in our atelier." />
          <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-5">
            {about.gallery.map((src, i) => (
              <Reveal key={src} delay={i * 0.1} className={i === 1 ? 'mt-10' : ''}>
                <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                  <Img src={src} alt="Hand embroidery and textiles from the atelier" width={700} sizes="33vw" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-luxe py-24 sm:py-32">
        <SectionHeading eyebrow="Brand Journey" title="The Story So Far" />
        <ol className="mx-auto mt-16 max-w-2xl border-l border-champagne">
          {about.journey.map((j, i) => (
            <Reveal as="li" key={i} delay={i * 0.08} className="relative pb-12 pl-10 last:pb-0">
              <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-champagne" />
              <p className={`font-serif text-2xl ${isPlaceholder(j.year) ? 'text-muted/70' : ''}`}>{j.year}</p>
              <p className={`mt-2 text-[15px] ${isPlaceholder(j.text) ? 'border border-dashed border-gold/50 px-3 py-2 text-muted' : 'text-charcoal'}`}>{j.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="bg-cream py-24 text-center">
        <Reveal className="container-luxe">
          <h2 className="text-[36px] sm:text-[48px]">Meet the Design Team</h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] text-muted">Begin your own RK FASHIONS story with a personal consultation.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/appointment" className="btn-dark">
              Book an Appointment
            </Link>
            <Link to="/bespoke" className="btn-outline">
              The Bespoke Studio
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
