import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const ProductsContext = createContext(null);

// Loads the published catalogue once; pages filter it client-side.
export function ProductsProvider({ children }) {
  const [state, setState] = useState({ products: [], status: 'loading', error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    api
      .products()
      .then(({ products }) => setState({ products, status: 'ready', error: null }))
      .catch((error) => setState({ products: [], status: 'error', error }));
  }, []);

  useEffect(load, [load]);

  return <ProductsContext.Provider value={{ ...state, reload: load }}>{children}</ProductsContext.Provider>;
}

export const useProducts = () => useContext(ProductsContext);
