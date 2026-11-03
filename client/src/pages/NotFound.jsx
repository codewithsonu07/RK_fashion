import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <section className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-[44px] sm:text-[60px]">This page has slipped away.</h1>
      <p className="mt-5 max-w-md text-[15px] text-muted">The piece or page you are looking for may have moved. Let us guide you back.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link to="/" className="btn-dark">
          Return Home
        </Link>
        <Link to="/collections" className="btn-outline">
          View Collections
        </Link>
      </div>
    </section>
  );
}
