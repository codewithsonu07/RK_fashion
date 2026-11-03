import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import { useProducts } from './products';
import { api } from '../lib/api';

const ShopContext = createContext(null);

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode) — keep in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

const itemKey = (slug, size, colour) => `${slug}|${size}|${colour}`;

// Server bag rows only hold slug/size/colour/qty; rebuild display data from the catalogue.
function hydrate(rows, products) {
  return rows
    .map((r) => {
      const p = products.find((x) => x.slug === r.slug);
      if (!p) return null;
      return { key: itemKey(r.slug, r.size, r.colour), slug: p.slug, name: p.name, price: p.price, image: p.images[0], size: r.size, colour: r.colour, qty: r.qty };
    })
    .filter(Boolean);
}

/**
 * Bag and wishlist live in the browser for guests. When a customer signs in,
 * the guest items are merged into their account and every change is saved to
 * the server, so the bag follows them across devices. Signing out clears the
 * device copy.
 */
export function ShopProvider({ children }) {
  const { user } = useAuth();
  const { products, status: productsStatus } = useProducts();
  const [bag, setBag] = usePersistentState('rk.bag', []);
  const [wishlist, setWishlist] = usePersistentState('rk.wishlist', []);
  const [toast, setToast] = useState(null);
  const [syncedUserId, setSyncedUserId] = useState(null);
  const prevUserId = useRef(undefined);

  // Merge on sign-in, clear on sign-out.
  useEffect(() => {
    const id = user?.id ?? null;
    if (prevUserId.current === undefined) {
      prevUserId.current = id;
    } else if (prevUserId.current && !id) {
      setBag([]);
      setWishlist([]);
      setSyncedUserId(null);
    }
    prevUserId.current = id;
    if (!id || syncedUserId === id || productsStatus !== 'ready') return;

    setWishlist((local) => [...new Set([...(user.wishlist || []), ...local])]);
    setBag((local) => {
      const merged = new Map(hydrate(user.bag || [], products).map((i) => [i.key, i]));
      for (const item of local) {
        const existing = merged.get(item.key);
        merged.set(item.key, existing ? { ...existing, qty: Math.min(5, Math.max(existing.qty, item.qty)) } : item);
      }
      return [...merged.values()];
    });
    setSyncedUserId(id);
  }, [user, products, productsStatus, syncedUserId, setBag, setWishlist]);

  // Save changes to the account (debounced) once merged.
  useEffect(() => {
    if (!user || syncedUserId !== user.id) return;
    const t = setTimeout(() => {
      api.saveWishlist(wishlist).catch(() => {});
      api.saveBag(bag.map(({ slug, size, colour, qty }) => ({ slug, size, colour, qty }))).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [bag, wishlist, user, syncedUserId]);

  const notify = useCallback((message) => {
    setToast({ message, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const addToBag = useCallback(
    (product, { size, colour, qty = 1, customSize = false }) => {
      const key = itemKey(product.slug, size, colour);
      setBag((items) => {
        const existing = items.find((i) => i.key === key);
        if (existing) return items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, 5) } : i));
        return [
          ...items,
          { key, slug: product.slug, name: product.name, price: product.price, image: product.images[0], size, colour, qty, customSize },
        ];
      });
      notify(`${product.name} added to your bag`);
    },
    [setBag, notify],
  );

  const value = useMemo(
    () => ({
      bag,
      bagCount: bag.reduce((n, i) => n + i.qty, 0),
      bagTotal: bag.reduce((n, i) => n + i.qty * i.price, 0),
      addToBag,
      updateQty: (key, qty) => setBag((items) => items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, 5)) } : i))),
      removeFromBag: (key) => setBag((items) => items.filter((i) => i.key !== key)),
      clearBag: () => setBag([]),
      wishlist,
      isWishlisted: (slug) => wishlist.includes(slug),
      toggleWishlist: (product) => {
        const has = wishlist.includes(product.slug);
        setWishlist((list) => (has ? list.filter((s) => s !== product.slug) : [...list, product.slug]));
        notify(has ? `${product.name} removed from your wishlist` : `${product.name} saved to your wishlist`);
      },
      toast,
      notify,
    }),
    [bag, wishlist, addToBag, setBag, setWishlist, toast, notify],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
