import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../store/shop';
import { useProducts } from '../store/products';
import { useAuth } from '../store/auth';
import { usePageTitle } from '../lib/usePageTitle';

export default function Wishlist() {
  usePageTitle('Wishlist');
  const { wishlist } = useShop();
  const { user } = useAuth();
  const { products, status } = useProducts();
  const items = products.filter((p) => wishlist.includes(p.slug));
  return (
    <section className="container-luxe min-h-[60vh] py-16 sm:py-24">
      <h1 className="text-center text-[44px] sm:text-[60px]">Wishlist</h1>
      <span className="gold-rule mt-5" />
      {status === 'ready' && items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] text-muted">You haven’t saved any pieces yet. Tap the heart on any design to keep it here.</p>
          <Link to="/new-arrivals" className="btn-dark mt-10">
            Discover New Arrivals
          </Link>
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} showSizes />
          ))}
        </div>
      )}
      {!user && (
        <p className="mt-16 text-center text-[13px] text-muted">
          Your wishlist is saved on this device.{' '}
          <Link to="/account/login?next=/wishlist" className="underline underline-offset-4">
            Sign in
          </Link>{' '}
          to keep it across devices.
        </p>
      )}
    </section>
  );
}
