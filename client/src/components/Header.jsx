import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Logo from './Logo';
import Img from './Img';
import { brand, mainNav, megaMenus } from '../data/site';
import { useShop } from '../store/shop';
import { useAuth } from '../store/auth';
import { useProducts } from '../store/products';
import { formatPrice } from '../lib/format';
import { img } from '../lib/image';

const ease = [0.22, 1, 0.36, 1];

export default function Header({ overlay = false }) {
  const { pathname } = useLocation();
  const { bagCount, wishlist } = useShop();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close everything on navigation.
  useEffect(() => {
    setMega(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMega(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const solid = !overlay || scrolled || mega || hovered || searchOpen;
  const tone = solid ? 'text-ink' : 'text-ivory';

  const openMega = (key) => {
    clearTimeout(closeTimer.current);
    setMega(key || null);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMega(null), 140);
  };

  return (
    <>
      <header
        className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 transition-colors duration-500 ${
          solid ? 'bg-ivory/97 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md' : 'bg-gradient-to-b from-ink/45 to-transparent'
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          scheduleClose();
        }}
      >
        {/* Announcement bar — collapses on scroll */}
        <div
          className={`overflow-hidden bg-ink text-ivory transition-[max-height] duration-500 ${scrolled ? 'max-h-0' : 'max-h-10'}`}
        >
          <Link
            to="/new-arrivals"
            className="block py-2.5 text-center text-[10px] uppercase tracking-[0.3em] transition-colors hover:text-champagne sm:text-[11px]"
          >
            {brand.announcement}
          </Link>
        </div>

        <div className={`container-luxe ${tone} transition-colors duration-500`}>
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[84px]">
            <div className="flex items-center gap-1">
              <button type="button" className="-ml-2 p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={22} strokeWidth={1.25} />
              </button>
              <button
                type="button"
                className="flex items-center gap-3 p-2 lg:-ml-2"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={19} strokeWidth={1.25} />
                <span className="label-caps hidden lg:inline">Search</span>
              </button>
            </div>

            <Link to="/" aria-label="RK FASHIONS — home">
              <Logo light={!solid} />
            </Link>

            <div className="flex items-center justify-end gap-0.5 sm:gap-2">
              <Link to="/account" className="hidden p-2 sm:block" aria-label={user ? `My account (${user.name})` : 'Sign in'}>
                {user ? (
                  <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border font-serif text-[13px] leading-none ${solid ? 'border-ink' : 'border-ivory'}`}>
                    {user.name[0].toUpperCase()}
                  </span>
                ) : (
                  <User size={19} strokeWidth={1.25} />
                )}
              </Link>
              <Link to="/wishlist" className="relative p-2" aria-label={`Wishlist, ${wishlist.length} items`}>
                <Heart size={19} strokeWidth={1.25} />
                {wishlist.length > 0 && <Badge n={wishlist.length} solid={solid} />}
              </Link>
              <Link to="/bag" className="relative -mr-2 p-2" aria-label={`Shopping bag, ${bagCount} items`}>
                <ShoppingBag size={19} strokeWidth={1.25} />
                {bagCount > 0 && <Badge n={bagCount} solid={solid} />}
              </Link>
            </div>
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center justify-center gap-x-7 pb-4 xl:gap-x-10">
              {mainNav.map((item) => (
                <li key={item.to} onMouseEnter={() => openMega(item.mega)} onFocus={() => openMega(item.mega)}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMega(null)}
                    aria-haspopup={item.mega ? 'true' : undefined}
                    aria-expanded={item.mega ? mega === item.mega : undefined}
                    className={({ isActive }) =>
                      `relative py-2 text-[11px] uppercase tracking-[0.2em] transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-champagne after:transition-transform after:duration-500 hover:after:scale-x-100 ${
                        isActive || mega === item.mega ? 'after:scale-x-100' : 'after:scale-x-0'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <AnimatePresence>
          {mega && (
            <motion.div
              key="mega"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory shadow-[0_24px_40px_-24px_rgba(20,18,16,0.25)] lg:block"
              onMouseEnter={() => openMega(mega)}
              onMouseLeave={scheduleClose}
            >
              <MegaPanel menu={megaMenus[mega]} onClose={() => setMega(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function Badge({ n, solid }) {
  return (
    <span
      className={`absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-normal ${
        solid ? 'bg-ink text-ivory' : 'bg-ivory text-ink'
      }`}
    >
      {n}
    </span>
  );
}

function MegaPanel({ menu, onClose }) {
  return (
    <div className="container-luxe grid grid-cols-[1fr_1fr_1fr_minmax(260px,320px)] gap-10 py-10 text-ink">
      {menu.columns.map((col, i) => (
        <div key={i}>
          <p className="eyebrow mb-5 h-4">{col.title}</p>
          <ul className="space-y-3">
            {col.links.map((l) => (
              <li key={l.to + l.label}>
                <Link to={l.to} onClick={onClose} className="text-[14px] tracking-wide text-charcoal transition-colors hover:text-gold-dark">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {menu.columns.length < 3 && <div />}
      <Link to={menu.feature.to} onClick={onClose} className="group relative block aspect-[4/5] overflow-hidden">
        <Img src={menu.feature.image} alt={menu.feature.title} width={500} sizes="320px" className="transition-transform duration-[1400ms] group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent" />
        <span className="absolute inset-x-0 bottom-6 text-center text-ivory">
          <span className="block font-serif text-2xl">{menu.feature.title}</span>
          <span className="link-underline mt-2 text-[10px]">Discover</span>
        </span>
      </Link>
    </div>
  );
}

function MobileMenu({ open, onClose }) {
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[61] flex w-[88%] max-w-sm flex-col bg-ivory"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.45, ease }}
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo compact />
              <button type="button" onClick={onClose} className="p-2" aria-label="Close menu">
                <X size={22} strokeWidth={1.25} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4">
              <ul>
                {mainNav.map((item) => (
                  <li key={item.to} className="border-b border-line/70">
                    {item.mega ? (
                      <>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between py-4 text-left text-[13px] uppercase tracking-[0.2em]"
                          aria-expanded={expanded === item.mega}
                          onClick={() => setExpanded(expanded === item.mega ? null : item.mega)}
                        >
                          {item.label}
                          <ChevronDown size={16} strokeWidth={1.25} className={`transition-transform ${expanded === item.mega ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded === item.mega && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pb-4 pl-3"
                            >
                              <li>
                                <Link to={item.to} onClick={onClose} className="block py-2 text-[14px] text-gold-dark">
                                  View all {item.label}
                                </Link>
                              </li>
                              {megaMenus[item.mega].columns
                                .flatMap((c) => c.links)
                                .filter((l) => l.to !== item.to)
                                .map((l) => (
                                  <li key={l.to + l.label}>
                                    <Link to={l.to} onClick={onClose} className="block py-2 text-[14px] text-charcoal">
                                      {l.label}
                                    </Link>
                                  </li>
                                ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link to={item.to} onClick={onClose} className="block py-4 text-[13px] uppercase tracking-[0.2em]">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 text-[13px] text-charcoal">
                <Link to="/account" onClick={onClose} className="flex items-center gap-3 py-1">
                  <User size={17} strokeWidth={1.25} /> My Account
                </Link>
                <Link to="/wishlist" onClick={onClose} className="flex items-center gap-3 py-1">
                  <Heart size={17} strokeWidth={1.25} /> Wishlist
                </Link>
                <Link to="/bag" onClick={onClose} className="flex items-center gap-3 py-1">
                  <ShoppingBag size={17} strokeWidth={1.25} /> Shopping Bag
                </Link>
              </div>
            </nav>
            <div className="border-t border-line p-5">
              <Link to="/appointment" onClick={onClose} className="btn-dark w-full">
                Book an Appointment
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const POPULAR = ['Lehenga', 'Sherwani', 'Saree', 'Kurta', 'Ivory', 'Bridal'];

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { products } = useProducts();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return products
      .filter((p) =>
        [p.name, p.category, p.gender, p.gender === 'women' ? 'woman' : 'man', ...(p.colours || []).map((c) => c.name), ...(p.occasions || [])]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [q, products]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="fixed inset-x-0 top-0 z-[71] bg-ivory pb-10 pt-6 shadow-xl"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="container-luxe">
              <div className="flex justify-end">
                <button type="button" onClick={onClose} className="p-2" aria-label="Close search">
                  <X size={22} strokeWidth={1.25} />
                </button>
              </div>
              <form onSubmit={submit} className="mx-auto mt-2 max-w-3xl">
                <label htmlFor="site-search" className="eyebrow">
                  Search RK FASHIONS
                </label>
                <div className="mt-3 flex items-center border-b border-ink">
                  <input
                    id="site-search"
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Lehengas, sherwanis, ivory…"
                    className="w-full bg-transparent py-4 font-serif text-2xl outline-none placeholder:text-muted/50 sm:text-4xl"
                    autoComplete="off"
                  />
                  <button type="submit" className="p-2" aria-label="Submit search">
                    <Search size={22} strokeWidth={1.25} />
                  </button>
                </div>
              </form>
              <div className="mx-auto mt-8 max-w-3xl">
                {results.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {results.map((p) => (
                      <li key={p.slug}>
                        <Link to={`/product/${p.slug}`} className="group flex gap-3">
                          <img src={img(p.images[0], 120, 160)} alt="" className="h-20 w-15 shrink-0 object-cover" />
                          <span>
                            <span className="block font-serif text-[17px] leading-tight group-hover:text-gold-dark">{p.name}</span>
                            <span className="mt-1 block text-[12px] text-muted">{formatPrice(p.price)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>
                    <p className="label-caps text-muted">{q.trim().length >= 2 ? 'No matching pieces — press Enter to search all' : 'Popular searches'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {POPULAR.map((term) => (
                        <Link
                          key={term}
                          to={`/search?q=${encodeURIComponent(term)}`}
                          className="border border-sand px-4 py-2 text-[12px] tracking-wide transition-colors hover:border-ink"
                        >
                          {term}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
