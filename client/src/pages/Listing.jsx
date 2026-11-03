import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import Img from '../components/Img';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductCard from '../components/ProductCard';
import { LoadingGrid, ErrorState } from '../components/States';
import NotFound from './NotFound';
import { categories, collectionBySlug, genderPages } from '../data/site';
import { useProducts } from '../store/products';
import { categoryLabel, inCategory, inCollection, OCCASION_LABELS, PRICE_BANDS, SORT_OPTIONS, sortProducts } from '../lib/catalog';
import { usePageTitle } from '../lib/usePageTitle';

const FILTER_KEYS = ['gender', 'category', 'occasion', 'price', 'colour', 'size'];
const getList = (params, key) => (params.get(key) ? params.get(key).split(',') : []);

/** One listing page for gender, category, collection, new arrivals, ready-to-wear and search. */
export default function Listing({ mode, gender: routeGender }) {
  const { category: routeCategory, slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { products, status, error, reload } = useProducts();
  const [drawer, setDrawer] = useState(false);
  const q = params.get('q') || '';
  const collection = mode === 'collection' ? collectionBySlug(slug) : null;

  const page = useMemo(() => {
    if (mode === 'gender') {
      const g = genderPages[routeGender];
      const catLabel = routeCategory && categoryLabel(routeGender, routeCategory);
      return {
        title: catLabel || g.title,
        eyebrow: routeCategory ? g.title : 'RK FASHIONS',
        intro: routeCategory ? null : g.intro,
        banner: routeCategory ? null : g.banner,
        bannerPosition: g.bannerPosition,
        crumbs: [{ label: 'Home', to: '/' }, routeCategory ? { label: g.title, to: `/${routeGender}` } : null, { label: catLabel || g.title }].filter(Boolean),
      };
    }
    if (mode === 'collection' && collection)
      return {
        title: collection.title,
        eyebrow: 'Collections',
        intro: collection.subtitle,
        banner: collection.image,
        bannerPosition: '50% 30%',
        crumbs: [{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection.title }],
      };
    if (mode === 'new') return { title: 'New Arrivals', eyebrow: 'Just In', intro: 'The newest pieces from the RK FASHIONS atelier.', crumbs: [{ label: 'Home', to: '/' }, { label: 'New Arrivals' }] };
    if (mode === 'rtw')
      return {
        title: 'Ready-to-Wear',
        eyebrow: 'Shop Now',
        intro: 'Designed in our atelier, finished by hand and ready to dispatch within 3–5 working days.',
        crumbs: [{ label: 'Home', to: '/' }, { label: 'Ready-to-Wear' }],
      };
    return { title: q ? `“${q}”` : 'Search', eyebrow: 'Search results', crumbs: [{ label: 'Home', to: '/' }, { label: 'Search' }] };
  }, [mode, routeGender, routeCategory, collection, q]);

  usePageTitle(mode === 'search' ? `Search: ${q}` : page.title, page.intro);

  // Products in scope for this page (before user filters).
  const scope = useMemo(() => {
    if (mode === 'gender') return products.filter((p) => inCategory(p, routeGender, routeCategory));
    if (mode === 'collection') return collection ? products.filter((p) => inCollection(p, slug)) : [];
    if (mode === 'new') return products.filter((p) => p.newArrival);
    if (mode === 'rtw') return products.filter((p) => p.readyToShip);
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) =>
      [p.name, p.category.replace(/-/g, ' '), p.gender, p.description, p.fabric, ...(p.colours || []).map((c) => c.name), ...(p.occasions || [])]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [products, mode, routeGender, routeCategory, collection, slug, q]);

  const facets = useMemo(() => {
    const genders = [...new Set(scope.map((p) => p.gender))];
    const cats = [...new Map(scope.map((p) => [`${p.gender}:${p.category}`, { gender: p.gender, slug: p.category }])).values()];
    const occasions = [...new Set(scope.flatMap((p) => p.occasions || []))];
    const colours = [...new Map(scope.flatMap((p) => p.colours || []).map((c) => [c.name, c])).values()];
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '40', '42', '44', '46'];
    const sizes = [...new Set(scope.flatMap((p) => p.sizes))].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
    return { genders, cats, occasions, colours, sizes };
  }, [scope]);

  const filtered = useMemo(() => {
    const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, getList(params, k)]));
    const bands = PRICE_BANDS.filter((b) => f.price.includes(b.value));
    const list = scope.filter(
      (p) =>
        (!f.gender.length || f.gender.includes(p.gender)) &&
        (!f.category.length || f.category.includes(p.category)) &&
        (!f.occasion.length || p.occasions?.some((o) => f.occasion.includes(o))) &&
        (!bands.length || bands.some((b) => p.price >= b.min && p.price < b.max)) &&
        (!f.colour.length || p.colours?.some((c) => f.colour.includes(c.name))) &&
        (!f.size.length || p.sizes.some((s) => f.size.includes(s))),
    );
    return sortProducts(list, params.get('sort') || (mode === 'new' ? 'newest' : 'featured'));
  }, [scope, params, mode]);

  const activeCount = FILTER_KEYS.reduce((n, k) => n + getList(params, k).length, 0);

  const toggle = (key, value) => {
    const next = new URLSearchParams(params);
    const list = getList(params, key);
    const updated = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    if (updated.length) next.set(key, updated.join(','));
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const clearAll = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (params.get('sort')) next.set('sort', params.get('sort'));
    setParams(next, { replace: true });
  };
  const setSort = (value) => {
    const next = new URLSearchParams(params);
    next.set('sort', value);
    setParams(next, { replace: true });
  };

  if (mode === 'collection' && !collection) return <NotFound />;
  if (mode === 'gender' && routeCategory && !categories[routeGender].some((c) => c.slug === routeCategory)) return <NotFound />;

  const filterPanel = (
    <FilterPanel
      facets={facets}
      params={params}
      toggle={toggle}
      showGender={mode !== 'gender'}
      showCategory={!(mode === 'gender' && routeCategory)}
      activeCount={activeCount}
      clearAll={clearAll}
    />
  );

  return (
    <>
      {page.banner ? (
        <section className="relative flex h-[56vh] min-h-[380px] items-end overflow-hidden bg-ink text-ivory">
          <Img src={page.banner} alt="" position={page.bannerPosition} width={1800} eager />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
          <div className="container-luxe relative z-10 pb-12 sm:pb-16">
            <Breadcrumbs items={page.crumbs} light />
            <motion.h1 className="mt-5 text-[46px] leading-none sm:text-[72px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
              {page.title}
            </motion.h1>
            {page.intro && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ivory/85">{page.intro}</p>}
            {collection?.bespoke && (
              <Link to="/bespoke" className="btn-gold mt-8">
                Start a Bespoke Design
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="border-b border-line bg-cream">
          <div className="container-luxe py-12 sm:py-16">
            <Breadcrumbs items={page.crumbs} />
            <p className="eyebrow mt-8">{page.eyebrow}</p>
            <h1 className="mt-3 text-[42px] leading-none sm:text-[60px]">{page.title}</h1>
            {page.intro && <p className="mt-4 max-w-xl text-[15px] text-muted">{page.intro}</p>}
          </div>
        </section>
      )}

      {mode === 'gender' && (
        <div className="border-b border-line">
          <div className="container-luxe scrollbar-none flex gap-2 overflow-x-auto py-4">
            <CategoryChip to={`/${routeGender}`} active={!routeCategory} label="All" />
            {categories[routeGender].map((c) => (
              <CategoryChip key={c.slug} to={`/${routeGender}/${c.slug}`} active={routeCategory === c.slug} label={c.label} />
            ))}
          </div>
        </div>
      )}

      <section className="container-luxe py-10 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-5">
          <button type="button" onClick={() => setDrawer(true)} className="label-caps flex items-center gap-2 lg:hidden">
            <SlidersHorizontal size={15} strokeWidth={1.25} /> Filter {activeCount > 0 && `(${activeCount})`}
          </button>
          <p className="hidden text-[13px] text-muted lg:block" aria-live="polite">
            {status === 'ready' && `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`}
          </p>
          <label className="flex items-center gap-3">
            <span className="label-caps hidden text-muted sm:inline">Sort by</span>
            <span className="relative">
              <select
                value={params.get('sort') || (mode === 'new' ? 'newest' : 'featured')}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer appearance-none border border-sand bg-ivory py-2.5 pl-4 pr-10 text-[13px] outline-none focus:border-ink"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={1.25} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </span>
          </label>
        </div>

        <div className="grid gap-12 lg:grid-cols-[230px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-44">{filterPanel}</div>
          </aside>
          <div>
            {status === 'loading' && <LoadingGrid count={6} />}
            {status === 'error' && <ErrorState error={error} onRetry={reload} />}
            {status === 'ready' && filtered.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
                {filtered.map((p, i) => (
                  <ProductCard key={p.slug} product={p} showSizes eager={i < 3} />
                ))}
              </div>
            )}
            {status === 'ready' && filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="font-serif text-3xl">{mode === 'search' && !q ? 'What are you looking for?' : 'No pieces match your selection.'}</p>
                <p className="mx-auto mt-4 max-w-md text-[14px] text-muted">
                  Every RK FASHIONS design can also be created especially for you — tell us what you have in mind.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  {activeCount > 0 && (
                    <button type="button" onClick={clearAll} className="btn-outline">
                      Clear Filters
                    </button>
                  )}
                  <Link to="/bespoke" className="btn-dark">
                    Design It Bespoke
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="fixed inset-y-0 right-0 z-[61] flex w-[88%] max-w-sm flex-col bg-ivory lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="label-caps">Filter</p>
                <button type="button" onClick={() => setDrawer(false)} className="p-2" aria-label="Close filters">
                  <X size={20} strokeWidth={1.25} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">{filterPanel}</div>
              <div className="border-t border-line p-5">
                <button type="button" onClick={() => setDrawer(false)} className="btn-dark w-full">
                  Show {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryChip({ to, active, label }) {
  return (
    <Link
      to={to}
      className={`shrink-0 border px-4 py-2 text-[12px] tracking-wide transition-colors ${active ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}
    >
      {label}
    </Link>
  );
}

function FilterPanel({ facets, params, toggle, showGender, showCategory, activeCount, clearAll }) {
  const sel = (key) => getList(params, key);
  return (
    <div className="space-y-1">
      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="link-underline mb-4 text-[10px] text-gold-dark">
          Clear all ({activeCount})
        </button>
      )}
      {showGender && facets.genders.length > 1 && (
        <FilterGroup title="Gender">
          {facets.genders.map((g) => (
            <Check key={g} label={g === 'women' ? 'Women' : 'Men'} checked={sel('gender').includes(g)} onChange={() => toggle('gender', g)} />
          ))}
        </FilterGroup>
      )}
      {showCategory && facets.cats.length > 1 && (
        <FilterGroup title="Category">
          {[...new Map(facets.cats.map((c) => [c.slug, c])).values()].map((c) => (
            <Check key={c.slug} label={categoryLabel(c.gender, c.slug)} checked={sel('category').includes(c.slug)} onChange={() => toggle('category', c.slug)} />
          ))}
        </FilterGroup>
      )}
      {facets.occasions.length > 1 && (
        <FilterGroup title="Occasion">
          {facets.occasions.map((o) => (
            <Check key={o} label={OCCASION_LABELS[o] || o} checked={sel('occasion').includes(o)} onChange={() => toggle('occasion', o)} />
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Price">
        {PRICE_BANDS.map((b) => (
          <Check key={b.value} label={b.label} checked={sel('price').includes(b.value)} onChange={() => toggle('price', b.value)} />
        ))}
      </FilterGroup>
      {facets.colours.length > 1 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-2.5">
            {facets.colours.map((c) => {
              const on = sel('colour').includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggle('colour', c.name)}
                  aria-pressed={on}
                  title={c.name}
                  aria-label={c.name}
                  className={`h-7 w-7 rounded-full border transition-all ${on ? 'ring-1 ring-ink ring-offset-2 ring-offset-ivory' : 'border-sand hover:scale-110'}`}
                  style={{ background: c.hex }}
                />
              );
            })}
          </div>
        </FilterGroup>
      )}
      {facets.sizes.length > 1 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = sel('size').includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle('size', s)}
                  aria-pressed={on}
                  className={`min-w-11 border px-2.5 py-2 text-[12px] transition-colors ${on ? 'border-ink bg-ink text-ivory' : 'border-sand hover:border-ink'}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line py-4">
      <button type="button" onClick={() => setOpen(!open)} className="label-caps flex w-full items-center justify-between py-1" aria-expanded={open}>
        {title}
        <ChevronDown size={14} strokeWidth={1.25} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-4 space-y-2.5">{children}</div>}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[13px] text-charcoal">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex h-4 w-4 items-center justify-center border border-sand transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-gold">
        {checked && <span className="h-1.5 w-1.5 bg-ivory" />}
      </span>
      {label}
    </label>
  );
}
