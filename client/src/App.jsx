import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Listing from './pages/Listing';
import RequireAuth from './components/RequireAuth';

const Product = lazy(() => import('./pages/Product'));
const Collections = lazy(() => import('./pages/Collections'));
const Bespoke = lazy(() => import('./pages/Bespoke'));
const Appointment = lazy(() => import('./pages/Appointment'));
const About = lazy(() => import('./pages/About'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Bag = lazy(() => import('./pages/Bag'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Account = lazy(() => import('./pages/Account'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const AuthPage = lazy(() => import('./pages/account/AuthPage'));
const OrderDetail = lazy(() => import('./pages/account/OrderDetail'));
const ForgotPassword = lazy(() => import('./pages/account/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/account/ResetPassword'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const AdminApp = lazy(() => import('./admin/AdminApp'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <Routes>
        <Route path="admin/*" element={<AdminApp />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new-arrivals" element={<Listing mode="new" />} />
          <Route path="ready-to-wear" element={<Listing mode="rtw" />} />
          <Route path="search" element={<Listing mode="search" />} />
          <Route path="women" element={<Listing mode="gender" gender="women" />} />
          <Route path="women/:category" element={<Listing mode="gender" gender="women" />} />
          <Route path="men" element={<Listing mode="gender" gender="men" />} />
          <Route path="men/:category" element={<Listing mode="gender" gender="men" />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:slug" element={<Listing mode="collection" />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="bespoke" element={<Bespoke />} />
          <Route path="appointment" element={<Appointment />} />
          <Route path="about" element={<About />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="bag" element={<Bag />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="account/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="account/register" element={<AuthPage key="register" mode="register" />} />
          <Route path="account/forgot-password" element={<ForgotPassword />} />
          <Route path="account/reset-password" element={<ResetPassword />} />
          <Route path="account/orders/:number" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="pages/:slug" element={<InfoPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
