import { Link } from 'react-router-dom';
import Logo from './Logo';
import Newsletter from './Newsletter';
import { brand, footerLinks } from '../data/site';

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', pinterest: 'Pinterest' };

export default function Footer() {
  const socials = Object.entries(brand.social).filter(([, url]) => url);
  const { contact } = brand;
  return (
    <footer className="bg-ink text-ivory">
      <div className="container-luxe grid gap-14 py-20 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <Logo light />
          <p className="mt-8 font-serif text-2xl italic text-champagne">{brand.tagline}</p>
          <p className="mt-4 text-[14px] leading-relaxed text-ivory/70">
            Premium Indian designer clothing and bespoke couture by {brand.designer}. Ready-to-wear and personally created pieces for women and men.
          </p>
          <div className="mt-10">
            <p className="eyebrow mb-2 text-champagne">The RK Letter</p>
            <Newsletter light />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-6 text-champagne">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-[14px] text-ivory/75 transition-colors hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow mb-6 text-champagne">Visit & Connect</p>
            <ul className="space-y-3 text-[14px] text-ivory/75">
              {contact.address && <li>{contact.address}</li>}
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-ivory">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="hover:text-ivory">
                    {contact.email}
                  </a>
                </li>
              )}
              <li>{contact.hours}</li>
              <li>
                <Link to="/appointment" className="hover:text-ivory">
                  Book a consultation →
                </Link>
              </li>
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noreferrer" className="hover:text-ivory">
                    {SOCIAL_LABELS[key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-[11px] uppercase tracking-[0.2em] text-ivory/50 sm:flex-row">
          <p>© {new Date().getFullYear()} RK FASHIONS · Founded by {brand.designer}</p>
          <p>Prices in Indian Rupees (₹)</p>
        </div>
      </div>
    </footer>
  );
}
