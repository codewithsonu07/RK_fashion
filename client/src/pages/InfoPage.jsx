import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import NotFound from './NotFound';
import { brand, infoPages } from '../data/site';
import { usePageTitle } from '../lib/usePageTitle';

export default function InfoPage() {
  const { slug } = useParams();
  const page = infoPages[slug];
  usePageTitle(page?.title);
  if (!page) return <NotFound />;
  const { contact } = brand;
  return (
    <section className="container-luxe max-w-3xl py-14 sm:py-20">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: page.title }]} />
      <h1 className="mt-8 text-[44px] leading-tight sm:text-[56px]">{page.title}</h1>
      <span className="mt-6 block h-px w-14 bg-champagne" />
      <div className="mt-10 space-y-5 text-[16px] leading-relaxed text-charcoal">
        {page.body.filter((p) => p.trim()).map((p, i) => (
          <p key={i} className={/\[.*\]/.test(p) ? 'border-l-2 border-dashed border-gold/60 pl-4' : ''}>
            {p}
          </p>
        ))}
      </div>
      {(slug === 'contact' || slug === 'support') && (
        <dl className="mt-12 grid gap-6 border-t border-line pt-10 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="label-caps text-muted">Studio hours</dt>
            <dd className="mt-2">{contact.hours}</dd>
          </div>
          {contact.email && (
            <div>
              <dt className="label-caps text-muted">Email</dt>
              <dd className="mt-2">
                <a href={`mailto:${contact.email}`} className="underline underline-offset-4">
                  {contact.email}
                </a>
              </dd>
            </div>
          )}
          {contact.phone && (
            <div>
              <dt className="label-caps text-muted">Phone</dt>
              <dd className="mt-2">
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>
              </dd>
            </div>
          )}
          {contact.address && (
            <div>
              <dt className="label-caps text-muted">Studio</dt>
              <dd className="mt-2">{contact.address}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <Link to="/appointment" className="btn-dark">
              Book an Appointment
            </Link>
          </div>
        </dl>
      )}
    </section>
  );
}
