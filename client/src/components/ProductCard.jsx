import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Img from './Img';
import { formatPrice } from '../lib/format';
import { useShop } from '../store/shop';

export default function ProductCard({ product, showSizes = false, eager = false }) {
  const { isWishlisted, toggleWishlist } = useShop();
  const saved = isWishlisted(product.slug);
  const [first, second] = product.images;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative">
      <Link to={href} className="relative block aspect-[3/4] overflow-hidden bg-beige" aria-label={product.name}>
        <Img
          src={first}
          alt={product.name}
          width={700}
          eager={eager}
          sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
          className="transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
        />
        {second && (
          <Img
            src={second}
            alt=""
            width={700}
            sizes="(min-width:1024px) 25vw, 50vw"
            className="!opacity-0 transition-opacity duration-700 group-hover:!opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.newArrival && <span className="bg-ivory/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em]">New</span>}
          {product.readyToShip && <span className="bg-ink/80 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-ivory">Ready to Ship</span>}
        </div>
        <span className="absolute inset-x-3 bottom-3 hidden translate-y-2 bg-ivory/95 py-3 text-center text-[10px] uppercase tracking-[0.28em] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:block">
          View Details
        </span>
      </Link>
      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center text-ink transition-transform hover:scale-110"
      >
        <Heart size={18} strokeWidth={1.25} className={saved ? 'fill-ink' : 'fill-ivory/60'} />
      </button>
      <div className="mt-4 space-y-1.5">
        <h3 className="font-serif text-[19px] leading-snug">
          <Link to={href} className="hover:text-gold-dark">
            {product.name}
          </Link>
        </h3>
        <p className="text-[13px] tracking-wide text-charcoal">{formatPrice(product.price)}</p>
        {showSizes && <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Sizes {product.sizes.join(' · ')}</p>}
        {showSizes && (
          <div className="flex gap-5 pt-2 md:hidden">
            <Link to={href} className="link-underline text-[10px]">
              View Details
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
