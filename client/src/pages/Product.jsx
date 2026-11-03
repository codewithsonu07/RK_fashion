import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, Minus, Plus, Ruler, Scissors, Truck } from 'lucide-react';
import Img from '../components/Img';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import { ErrorState } from '../components/States';
import NotFound from './NotFound';
import { useProducts } from '../store/products';
import { useShop } from '../store/shop';
import { formatPrice } from '../lib/format';
import { categoryLabel } from '../lib/catalog';
import { usePageTitle } from '../lib/usePageTitle';
import { img } from '../lib/image';
import { assetUrl } from '../lib/config';

const CUSTOM = 'Custom';

export default function Product() {
  const { slug } = useParams();
  const { products, status, error, reload } = useProducts();
  const product = products.find((p) => p.slug === slug);

  if (status === 'loading') return <div className="container-luxe min-h-[70vh] py-16"><div className="aspect-[3/4] w-full max-w-xl animate-pulse bg-beige" /></div>;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;
  if (!product) return <NotFound />;
  return <ProductView key={product.slug} product={product} products={products} />;
}

function ProductView({ product, products }) {
  usePageTitle(product.name, product.description, {
    image: product.images[0],
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map((src) => img(src, 1200)),
      sku: product.slug,
      category: categoryLabel(product.gender, product.category),
      brand: { '@type': 'Brand', name: 'RK FASHIONS' },
      material: product.fabric,
      color: product.colours?.map((c) => c.name).join(', '),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: window.location.origin + window.location.pathname,
      },
    },
  });
  const navigate = useNavigate();
  const { addToBag, toggleWishlist, isWishlisted } = useShop();
  const [active, setActive] = useState(0);
  const [colour, setColour] = useState(product.colours?.[0]?.name || '');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guide, setGuide] = useState(false);
  const saved = isWishlisted(product.slug);
  const soldOut = product.stock <= 0;
  const genderLabel = product.gender === 'women' ? 'Women' : 'Men';

  const similar = useMemo(
    () =>
      products
        .filter((p) => p.slug !== product.slug && p.gender === product.gender)
        .map((p) => ({ p, score: (p.category === product.category ? 3 : 0) + p.collections.filter((c) => product.collections.includes(c)).length }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((x) => x.p),
    [products, product],
  );

  useEffect(() => setSizeError(false), [size]);

  const add = (thenCheckout) => {
    if (!size) {
      setSizeError(true);
      return;
    }
    if (size === CUSTOM) {
      navigate(`/bespoke?product=${product.slug}`);
      return;
    }
    addToBag(product, { size, colour, qty });
    if (thenCheckout) navigate('/bag');
  };

  return (
    <>
      <div className="container-luxe pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: genderLabel, to: `/${product.gender}` },
            { label: categoryLabel(product.gender, product.category), to: `/${product.gender}/${product.category}` },
            { label: product.name },
          ]}
        />
      </div>

      <section className="container-luxe grid gap-10 py-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-12">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {product.images.length > 1 && (
            <div className="scrollbar-none flex gap-3 overflow-x-auto sm:w-20 sm:flex-col">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={active === i}
                  className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-beige transition-opacity sm:w-full ${active === i ? 'opacity-100 ring-1 ring-ink' : 'opacity-60 hover:opacity-100'}`}
                >
                  <Img src={src} alt="" width={160} sizes="80px" />
                </button>
              ))}
            </div>
          )}
          <ZoomImage src={product.images[active]} alt={`${product.name} — image ${active + 1}`} />
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <div className="flex flex-wrap gap-2">
            {product.newArrival && <span className="label-caps border border-line px-2.5 py-1 text-[10px]">New Arrival</span>}
            {product.readyToShip && <span className="label-caps border border-line px-2.5 py-1 text-[10px]">Ready to Ship</span>}
            {product.bestSeller && <span className="label-caps border border-line px-2.5 py-1 text-[10px]">Best Seller</span>}
          </div>
          <h1 className="mt-5 text-[38px] leading-[1.05] sm:text-[46px]">{product.name}</h1>
          <p className="mt-4 text-[18px] tracking-wide">{formatPrice(product.price)}</p>
          <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>
          <p className="mt-6 text-[15px] leading-relaxed text-charcoal">{product.description}</p>

          {product.colours?.length > 0 && (
            <fieldset className="mt-8">
              <legend className="label-caps">
                Colour <span className="ml-2 normal-case tracking-normal text-muted">{colour}</span>
              </legend>
              <div className="mt-3 flex gap-3">
                {product.colours.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColour(c.name)}
                    aria-pressed={colour === c.name}
                    aria-label={c.name}
                    title={c.name}
                    className={`h-9 w-9 rounded-full border border-sand transition-all ${colour === c.name ? 'ring-1 ring-ink ring-offset-2 ring-offset-ivory' : 'hover:scale-105'}`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-8">
            <div className="flex items-center justify-between">
              <legend className="label-caps">Size</legend>
              <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-2 text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline">
                <Ruler size={14} strokeWidth={1.25} /> Size Guide
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-invalid={sizeError}>
              {[...product.sizes, ...(product.customisable ? [CUSTOM] : [])].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 border px-3 py-2.5 text-[13px] transition-colors ${
                    size === s ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'
                  } ${s === CUSTOM ? 'px-4' : ''}`}
                >
                  {s === CUSTOM ? 'Custom Size' : s}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {sizeError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-[13px] text-error" role="alert">
                  Please select a size.
                </motion.p>
              )}
            </AnimatePresence>
            {size === CUSTOM && (
              <p className="mt-3 bg-cream p-4 text-[13px] leading-relaxed text-charcoal">
                Made to your measurements. Continue to share your measurements and preferences — our designer will confirm fit and the final quotation before production.
              </p>
            )}
          </fieldset>

          {size !== CUSTOM && (
            <div className="mt-8 flex items-center gap-4">
              <span className="label-caps">Qty</span>
              <div className="flex items-center border border-sand">
                <button type="button" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
                  <Minus size={14} strokeWidth={1.25} />
                </button>
                <span className="w-8 text-center text-[14px]" aria-live="polite">
                  {qty}
                </span>
                <button type="button" className="p-3" onClick={() => setQty(Math.min(Math.max(1, product.stock), 5, qty + 1))} aria-label="Increase quantity">
                  <Plus size={14} strokeWidth={1.25} />
                </button>
              </div>
              {product.stock > 0 && product.stock <= 3 && <span className="text-[12px] text-gold-dark">Only {product.stock} left</span>}
            </div>
          )}

          <div className="mt-8 grid grid-cols-[1fr_auto] gap-3">
            {size === CUSTOM ? (
              <button type="button" onClick={() => add(false)} className="btn-dark">
                Continue with Custom Size
              </button>
            ) : (
              <button type="button" onClick={() => add(false)} disabled={soldOut} className="btn-dark">
                {soldOut ? 'Sold Out' : 'Add to Bag'}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex w-14 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              <Heart size={18} strokeWidth={1.25} className={saved ? 'fill-current' : ''} />
            </button>
            {size !== CUSTOM && (
              <button type="button" onClick={() => add(true)} disabled={soldOut} className="btn-outline col-span-2">
                Buy Now
              </button>
            )}
          </div>

          {product.customisable && (
            <Link
              to={`/bespoke?product=${product.slug}`}
              className="mt-6 flex items-center gap-4 border border-champagne/60 bg-cream px-5 py-4 transition-colors hover:border-gold"
            >
              <Scissors size={18} strokeWidth={1.25} className="shrink-0 text-gold-dark" />
              <span>
                <span className="label-caps block">Request Customisation</span>
                <span className="mt-1 block text-[13px] text-muted">Change the colour, embroidery or silhouette with our designer.</span>
              </span>
            </Link>
          )}

          <div className="mt-6 flex items-start gap-4 text-[13px] text-charcoal">
            <Truck size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-gold-dark" />
            <p>{product.delivery}</p>
          </div>

          <div className="mt-8 border-t border-line">
            <Accordion title="Description" defaultOpen>
              {product.description}
            </Accordion>
            <Accordion title="Fabric & Care">
              <p>{product.fabric}</p>
              <p className="mt-2">{product.care}</p>
            </Accordion>
            <Accordion title="Craftsmanship">{product.craft}</Accordion>
            <Accordion title="Delivery & Returns">
              <p>{product.delivery}</p>
              <p className="mt-2">
                Ready-to-ship pieces may be returned in original condition. Customised and made-to-measure pieces are final sale.{' '}
                <Link to="/pages/returns" className="underline underline-offset-4">
                  Returns policy
                </Link>
              </p>
            </Accordion>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="border-t border-line bg-cream py-20">
          <div className="container-luxe">
            <h2 className="text-center text-[34px] sm:text-[42px]">You May Also Love</h2>
            <span className="gold-rule mt-5" />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
              {similar.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Modal open={guide} onClose={() => setGuide(false)} title="Size Guide" wide>
        <SizeGuide gender={product.gender} />
      </Modal>
    </>
  );
}

function ZoomImage({ src, alt }) {
  const [zoom, setZoom] = useState(null);
  return (
    <div
      className="relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden bg-beige"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setZoom(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onMouseLeave={() => setZoom(null)}
    >
      <AnimatePresence mode="wait">
        <motion.div key={src} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <Img
            src={src}
            alt={alt}
            width={1400}
            eager
            sizes="(min-width:1024px) 55vw, 100vw"
            className="transition-transform duration-300"
          />
          {zoom && (
            <span
              className="absolute inset-0 hidden bg-no-repeat lg:block"
              style={{ backgroundImage: `url(${src.includes('unsplash') ? `${src}?auto=format&w=2000&q=80` : assetUrl(src)})`, backgroundSize: '200%', backgroundPosition: zoom }}
              aria-hidden
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="label-caps flex w-full items-center justify-between py-5">
        {title}
        {open ? <Minus size={14} strokeWidth={1.25} /> : <Plus size={14} strokeWidth={1.25} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-6 text-[14px] leading-relaxed text-charcoal">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SIZE_CHARTS = {
  women: {
    head: ['Size', 'Bust', 'Waist', 'Hips'],
    rows: [
      ['XS', '32', '26', '35'],
      ['S', '34', '28', '37'],
      ['M', '36', '30', '39'],
      ['L', '38', '32', '41'],
      ['XL', '40', '34', '43'],
      ['XXL', '42', '36', '45'],
    ],
  },
  men: {
    head: ['Size', 'Chest', 'Waist', 'Shoulder'],
    rows: [
      ['S / 36', '36', '30', '17'],
      ['M / 38', '38', '32', '17.5'],
      ['L / 40', '40', '34', '18'],
      ['XL / 42', '42', '36', '18.5'],
      ['XXL / 44', '44', '38', '19'],
      ['46', '46', '40', '19.5'],
    ],
  },
};

function SizeGuide({ gender }) {
  const chart = SIZE_CHARTS[gender];
  return (
    <div>
      <p className="text-[14px] text-muted">Body measurements in inches. Between sizes? Choose the larger size or select Custom Size for a made-to-measure fit.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-ink">
              {chart.head.map((h) => (
                <th key={h} className="label-caps py-3 pr-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r) => (
              <tr key={r[0]} className="border-b border-line">
                {r.map((c, i) => (
                  <td key={i} className="py-3 pr-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-[13px] text-muted">
        Prefer to be measured by our master tailor?{' '}
        <Link to="/appointment" className="text-ink underline underline-offset-4">
          Book a measurement consultation
        </Link>
        .
      </p>
    </div>
  );
}
