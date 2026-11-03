import { Link } from 'react-router-dom';
import Img from '../components/Img';
import Reveal from '../components/Reveal';
import Breadcrumbs from '../components/Breadcrumbs';
import { collections } from '../data/site';
import { useProducts } from '../store/products';
import { inCollection } from '../lib/catalog';
import { usePageTitle } from '../lib/usePageTitle';

export default function Collections() {
  usePageTitle('Collections', 'Explore RK FASHIONS collections — bridal, groom, wedding, festive, signature, occasion wear, ready-to-ship and bespoke.');
  const { products, status } = useProducts();
  return (
    <>
      <section className="border-b border-line bg-cream">
        <div className="container-luxe py-14 text-center sm:py-20">
          <div className="flex justify-center">
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
          </div>
          <h1 className="mt-8 text-[48px] leading-none sm:text-[72px]">Collections</h1>
          <span className="gold-rule mt-6" />
          <p className="mx-auto mt-6 max-w-xl text-[15px] text-muted">Each collection is a chapter of the RK FASHIONS story — explore the worlds of the house.</p>
        </div>
      </section>
      <section className="container-luxe grid gap-x-6 gap-y-14 py-16 sm:grid-cols-2 sm:py-24 lg:grid-cols-3">
        {collections.map((c, i) => {
          const count = products.filter((p) => inCollection(p, c.slug)).length;
          return (
            <Reveal key={c.slug} delay={(i % 3) * 0.08}>
              <Link to={`/collections/${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                  <Img src={c.image} alt={c.title} width={800} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" position="50% 25%" className="transition-transform duration-[1800ms] group-hover:scale-105" />
                </div>
                <h2 className="mt-6 text-[28px] leading-tight">{c.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.subtitle}</p>
                <p className="label-caps mt-4 text-gold-dark">{status === 'ready' ? `${count} pieces · Discover` : 'Discover'}</p>
              </Link>
            </Reveal>
          );
        })}
      </section>
    </>
  );
}
