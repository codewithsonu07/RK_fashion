import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useShop } from '../store/shop';
import { formatPrice } from '../lib/format';
import { img } from '../lib/image';
import { usePageTitle } from '../lib/usePageTitle';

export default function Bag() {
  usePageTitle('Shopping Bag', null, { noindex: true });
  const { bag, bagTotal, updateQty, removeFromBag } = useShop();

  if (bag.length === 0)
    return (
      <section className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="text-[44px] sm:text-[60px]">Your Bag</h1>
        <span className="gold-rule mt-5" />
        <p className="mt-8 text-[15px] text-muted">Your shopping bag is empty.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/women" className="btn-dark">
            Shop Women
          </Link>
          <Link to="/men" className="btn-outline">
            Shop Men
          </Link>
        </div>
      </section>
    );

  return (
    <section className="container-luxe py-14 sm:py-20">
      <h1 className="text-[44px] sm:text-[56px]">Your Bag</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {bag.map((item) => (
            <li key={item.key} className="flex gap-5 py-6">
              <Link to={`/product/${item.slug}`} className="shrink-0">
                <img src={img(item.image, 220, 293)} alt={item.name} className="h-36 w-27 object-cover sm:h-44 sm:w-33" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-serif text-[22px] leading-tight hover:text-gold-dark">
                      {item.name}
                    </Link>
                    <p className="mt-2 text-[13px] text-muted">
                      Size {item.size}
                      {item.colour && ` · ${item.colour}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeFromBag(item.key)} className="self-start p-1 text-muted hover:text-ink" aria-label={`Remove ${item.name}`}>
                    <X size={16} strokeWidth={1.25} />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between pt-4">
                  <div className="flex items-center border border-sand">
                    <button type="button" className="p-2.5" onClick={() => updateQty(item.key, item.qty - 1)} aria-label="Decrease quantity">
                      <Minus size={13} strokeWidth={1.25} />
                    </button>
                    <span className="w-7 text-center text-[13px]">{item.qty}</span>
                    <button type="button" className="p-2.5" onClick={() => updateQty(item.key, item.qty + 1)} aria-label="Increase quantity">
                      <Plus size={13} strokeWidth={1.25} />
                    </button>
                  </div>
                  <p className="text-[15px]">{formatPrice(item.price * item.qty)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit bg-beige p-8 lg:sticky lg:top-40">
          <p className="eyebrow">Order Summary</p>
          <dl className="mt-6 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(bagTotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Shipping</dt>
              <dd>Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-sand pt-4 font-serif text-2xl">
              <dt>Total</dt>
              <dd>{formatPrice(bagTotal)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn-dark mt-8 w-full">
            Proceed to Checkout
          </Link>
          <Link to="/new-arrivals" className="link-underline mt-6 block w-fit">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
