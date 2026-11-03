import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { products as defaultProducts } from '../data/products';

const ProductsContext = createContext(null);

// Loads the published catalogue once; pages filter it client-side.
export function ProductsProvider({ children }) {
  const [state, setState] = useState({
    products: defaultProducts,
    status: 'ready',
    error: null,
  });

  const load = useCallback(() => {
    api
      .products()
      .then(({ products }) => {
        if (Array.isArray(products) && products.length > 0) {
          setState({ products, status: 'ready', error: null });
        } else {
          setState({ products: defaultProducts, status: 'ready', error: null });
        }
      })
      .catch(() => {
        // Smoothly fall back to default catalogue if backend is unreachable
        setState({ products: defaultProducts, status: 'ready', error: null });
      });
  }, []);

  useEffect(load, [load]);

  return <ProductsContext.Provider value={{ ...state, reload: load }}>{children}</ProductsContext.Provider>;
}

export const useProducts = () => useContext(ProductsContext);
