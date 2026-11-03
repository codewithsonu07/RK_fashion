import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import App from './App';
import { ProductsProvider } from './store/products';
import { ShopProvider } from './store/shop';
import { AuthProvider } from './store/auth';
import { loadContent } from './lib/content';
import './index.css';

await loadContent();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ProductsProvider>
            <ShopProvider>
              <App />
            </ShopProvider>
          </ProductsProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);
