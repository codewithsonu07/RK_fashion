import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import { LoadingGrid, ErrorState } from '../components/States';
import { brand, collectionBySlug, home, instagramGallery, testimonials } from '../data/site';
import { useProducts } from '../store/products';
import { sortProducts } from '../lib/catalog';
import { usePageTitle } from '../lib/usePageTitle';

const ease = [0.22, 1, 0.36, 1];

export default function Home() {
  usePageTitle(null);
  const { products, status, error, reload } = useProducts();
  // Sample testimonials are only rendered in development (see data/site.js).
  const visibleTestimonials = testimonials.filter((t) => t.quote && (!t.sample || import.meta.env.DEV));

  const newArrivals = useMemo(() => sortProducts(products.filter((p) => p.newArrival), 'newest').slice(0, 8), [products]);
  const readyToWear = useMemo(() => {
    const rtw = sortProducts(products.filter((p) => p.readyToShip), 'bestsellers');
    const women = rtw.filter((p) => p.gender === 'women').slice(0, 2);
    const men = rtw.filter((p) => p.gender === 'men').slice(0, 2);
    return [women[0], men[0], women[1], men[1]].filter(Boolean);
  }, [products]);

  return (
    <>
      <Hero />

      {/* Shop by gender */}
      <section className="container-luxe py-24 sm:py-32" aria-labelledby="shop-gender">
        <SectionHeading eyebrow="Shop the House" title={<span id="shop-gender">For Her. For Him.</span>} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {home.gender.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.12}>
              <Link to={g.to} className="group relative block aspect-[4/5] overflow-hidden bg-beige sm:aspect-[3/4] lg:aspect-[4/5]">
                <Img src={g.image} alt={`Shop ${g.label}`} position={g.position} width={1100} sizes="(min-width:640px) 50vw, 100vw" className="transition-transform duration-[1800ms] ease-[var(--ease-luxe)] group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent" />
                <span className="absolute inset-x-0 bottom-10 text-center text-ivory">
                  <span className="block font-serif text-5xl tracking-[0.12em] sm:text-6xl">{g.label.toUpperCase()}</span>
                  <span className="link-underline mt-4">Explore</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Signature collections */}
      <section className="bg-beige py-24 sm:py-32" aria-label="Signature collections">
        <div className="container-luxe">
          <SectionHeading eyebrow="Signature Collections" title="Stories Told in Thread" text="Four worlds from the RK FASHIONS atelier — each designed around the moments that matter." />
          <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {home.signature.map((slug, i) => {
              const c = collectionBySlug(slug);
              return (
                <Reveal key={slug} delay={i * 0.1} className={i % 2 ? 'lg:mt-16' : ''}>
                  <Link to={`/collections/${slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                      <Img src={c.image} alt={c.title} width={700} sizes="(min-width:1024px) 25vw, 50vw" position="50% 25%" className="transition-transform duration-[1800ms] group-hover:scale-105" />
                    </div>
                    <h3 className="mt-5 font-serif text-[22px] leading-tight sm:text-2xl">{c.title}</h3>
                    <span className="link-underline mt-2 text-[10px] text-gold-dark">Discover</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-luxe py-24 sm:py-32" aria-label="New arrivals">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading align="left" eyebrow="Just In" title="New Arrivals" className="text-center sm:text-left [&>span]:mx-auto sm:[&>span]:mx-0" />
          <Link to="/new-arrivals" className="link-underline shrink-0">
            View All
          </Link>
        </div>
        <div className="mt-14">
          {status === 'loading' && <LoadingGrid count={4} />}
          {status === 'error' && <ErrorState error={error} onRetry={reload} />}
          {status === 'ready' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {newArrivals.map((p) => (
                <ProductCard key={p.slug} product={p} showSizes />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bespoke experience */}
      <section className="relative overflow-hidden bg-ink text-ivory" aria-label="Bespoke fashion experience">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[460px] lg:min-h-[760px]">
            <Img src={home.bespoke.image} alt="A hand-embroidered lehenga and sherwani hanging in the atelier" width={1200} sizes="(min-width:1024px) 50vw, 100vw" position="50% 40%" />
          </div>
          <div className="flex items-center px-6 py-20 sm:px-14 lg:px-20">
            <Reveal className="max-w-lg">
              <p className="eyebrow text-champagne">{home.bespoke.eyebrow}</p>
              <h2 className="mt-6 text-[40px] leading-[1.05] sm:text-[58px]">{home.bespoke.title}</h2>
              <span className="mt-8 block h-px w-14 bg-champagne" />
              <p className="mt-8 text-[16px] leading-relaxed text-ivory/80">{home.bespoke.text}</p>
              <ol className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] text-ivory/70 sm:grid-cols-3">
                {['Share your vision', 'Design consultation', 'Measurements & fabric', 'Design approval', 'Final crafting', 'Delivery'].map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span className="font-serif text-champagne">0{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <Link to="/bespoke" className="btn-gold mt-12">
                Create Your Design <ArrowRight size={14} strokeWidth={1.25} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Ready-to-wear */}
      <section className="container-luxe py-24 sm:py-32" aria-label="Ready-to-wear">
        <SectionHeading eyebrow="Ready-to-Wear" title="Finished by Hand. Ready for You." text="Selected pieces for women and men, dispatched within days." />
        <div className="mt-14">
          {status === 'ready' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
              {readyToWear.map((p) => (
                <ProductCard key={p.slug} product={p} showSizes />
              ))}
            </div>
          )}
          {status === 'loading' && <LoadingGrid count={4} />}
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          <Link to="/ready-to-wear?gender=women" className="btn-outline">
            Women’s Ready-to-Wear
          </Link>
          <Link to="/ready-to-wear?gender=men" className="btn-outline">
            Men’s Ready-to-Wear
          </Link>
        </div>
      </section>

      {/* Brand story */}
      <section className="bg-cream py-24 sm:py-32" aria-label="The RK FASHIONS story">
        <div className="container-luxe grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <Img src={home.story.image} alt="Hands resting on hand-printed floral fabric" width={900} sizes="(min-width:1024px) 45vw, 100vw" />
            </div>
            <div className="absolute -bottom-10 -right-4 hidden aspect-square w-48 overflow-hidden border-8 border-cream bg-sand sm:block lg:-right-12 lg:w-56">
              <Img src={home.story.detail} alt="Spools of thread in the atelier" width={400} sizes="224px" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The RK FASHIONS Story</p>
            <h2 className="mt-6 text-[38px] leading-[1.08] sm:text-[52px]">
              A House Built Around <em className="text-gold-dark">You</em>
            </h2>
            <span className="mt-8 block h-px w-14 bg-champagne" />
            <p className="mt-8 text-[16px] leading-relaxed text-charcoal">
              RK FASHIONS was founded by designer {brand.designer} with a belief that clothing should be as individual as the person wearing it. Every collection honours India’s
              textile heritage — while every bespoke commission begins with a conversation about you.
            </p>
            <blockquote className="mt-8 border-l border-champagne pl-6 font-serif text-2xl italic text-ink">“{brand.philosophy}”</blockquote>
            <Link to="/about" className="link-underline mt-10">
              Meet the Designer
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Appointment banner */}
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden text-center text-ivory" aria-label="Book an appointment">
        <Img src={home.appointment.image} alt="Bride and groom in RK FASHIONS wedding wear" width={1800} position="50% 30%" />
        <span className="absolute inset-0 bg-ink/55" />
        <Reveal className="relative z-10 max-w-2xl px-6 py-24">
          <p className="eyebrow text-champagne">Personal Consultations</p>
          <h2 className="mt-6 text-[40px] leading-[1.05] sm:text-[60px]">{home.appointment.title}</h2>
          <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-ivory/85">{home.appointment.text}</p>
          <Link to="/appointment" className="btn-outline-light mt-10">
            Book an Appointment
          </Link>
        </Reveal>
      </section>

      {/* Testimonials */}
      {visibleTestimonials.length > 0 && (
        <section className="container-luxe py-24 sm:py-32" aria-label="Client stories">
          <SectionHeading eyebrow="Client Stories" title="In Their Words" />
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {visibleTestimonials.map((t, i) => (
              <Reveal key={i} delay={i * 0.1} as="figure" className="border-t border-line pt-8 text-center">
                <span className="font-serif text-5xl leading-none text-champagne" aria-hidden>
                  “
                </span>
                <blockquote className="mt-2 font-serif text-[21px] leading-relaxed italic">{t.quote}</blockquote>
                <figcaption className="mt-6">
                  <span className="label-caps block">{t.name}</span>
                  <span className="mt-1 block text-[12px] text-muted">{t.detail}</span>
                  {t.sample && <span className="mt-2 inline-block border border-dashed border-gold px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">Sample · dev only</span>}
                </figcaption>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Instagram gallery */}
      <section className="bg-beige py-24" aria-label="Instagram gallery">
        <div className="container-luxe">
          <SectionHeading eyebrow={brand.instagramHandle} title="Follow the Atelier" />
          <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
            {instagramGallery.map((src, i) => {
              const inner = (
                <span className="group relative block aspect-square overflow-hidden bg-sand">
                  <Img src={src} alt="" width={400} sizes="(min-width:1024px) 16vw, 33vw" className="transition-transform duration-1000 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
                </span>
              );
              return brand.social.instagram ? (
                <a key={i} href={brand.social.instagram} target="_blank" rel="noreferrer" aria-label={`RK FASHIONS on Instagram, image ${i + 1}`}>
                  {inner}
                </a>
              ) : (
                <Link key={i} to="/collections" aria-label={`Explore collections, image ${i + 1}`}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-luxe py-24 text-center sm:py-28" aria-label="Newsletter">
        <Reveal className="mx-auto max-w-xl">
          <p className="eyebrow">The RK Letter</p>
          <h2 className="mt-5 text-[34px] sm:text-[44px]">First to Know</h2>
          <p className="mt-5 text-[15px] text-muted">New collections, private previews and trunk-show invitations — delivered with care, never too often.</p>
          <div className="mt-10">
            <Newsletter />
          </div>
        </Reveal>
      </section>
    </>
  );
}

function Hero() {
  const { panels } = home.hero;
  return (
    <section className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink text-ivory" aria-label="The Art of Elegance">
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_1.25fr_1fr]">
        {panels.map((p, i) => (
          <motion.div
            key={p.image}
            className={`relative overflow-hidden ${i === 1 ? '' : 'hidden md:block'}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, delay: 0.15 * i, ease }}
          >
            <Img src={p.image} alt={p.alt} position={p.position} width={1200} eager sizes="(min-width:768px) 40vw, 100vw" />
          </motion.div>
        ))}
      </div>
      <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30" />
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-20 text-center sm:pb-24">
        <motion.p className="eyebrow text-champagne" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6, ease }}>
          {home.hero.eyebrow}
        </motion.p>
        <motion.h1
          className="mt-5 text-[46px] leading-[0.98] tracking-[0.06em] sm:text-[76px] lg:text-[96px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.75, ease }}
        >
          {home.hero.title.toUpperCase()}
        </motion.h1>
        <motion.p className="mt-5 font-serif text-xl italic text-ivory/90 sm:text-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.05 }}>
          {home.hero.subtitle}
        </motion.p>
        <motion.div
          className="mt-10 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.25, ease }}
        >
          <Link to="/collections" className="btn bg-ivory text-ink hover:bg-champagne">
            Explore Collection
          </Link>
          <Link to="/bespoke" className="btn-outline-light">
            Design Your Outfit
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
