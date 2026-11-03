import { lazy, Suspense, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, CalendarDays, ExternalLink, LayoutTemplate, ListTree, LogOut, Menu, Package, Scissors, ShoppingBag, Users, X } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/auth';
import { usePageTitle } from '../lib/usePageTitle';
import { Loading } from './ui';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductEditor = lazy(() => import('./pages/ProductEditor'));
const Orders = lazy(() => import('./pages/Orders'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Customers = lazy(() => import('./pages/Customers'));
const Catalogue = lazy(() => import('./pages/Catalogue'));
const Content = lazy(() => import('./pages/Content'));

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products & Inventory', icon: Package },
  { to: '/admin/catalogue', label: 'Categories & Collections', icon: ListTree },
  { to: '/admin/enquiries', label: 'Bespoke Enquiries', icon: Scissors },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/admin/customers', label: 'Customers & Newsletter', icon: Users },
  { to: '/admin/content', label: 'Homepage & Content', icon: LayoutTemplate },
];

export default function AdminApp() {
  usePageTitle('Admin', null, { noindex: true });
  const { user, status, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (status === 'loading') return <div className="min-h-screen bg-ivory" />;
  if (!user) return <Navigate to={`/account/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'admin')
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
        <Logo />
        <h1 className="mt-10 text-4xl">Admin access required</h1>
        <p className="mt-4 max-w-md text-[15px] text-muted">
          You are signed in as {user.email}, which is not an admin account. An existing admin can grant access with <code>npm run create-admin</code>.
        </p>
        <Link to="/" className="btn-dark mt-8">
          Back to the website
        </Link>
      </div>
    );

  const sidebar = (
    <nav className="flex h-full flex-col bg-ink text-ivory" aria-label="Admin">
      <div className="flex items-center justify-between px-6 py-6">
        <Link to="/admin" onClick={() => setOpen(false)}>
          <Logo light compact />
        </Link>
        <button type="button" className="p-1 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <p className="px-6 text-[10px] uppercase tracking-[0.3em] text-champagne">Studio Admin</p>
      <ul className="mt-6 flex-1 space-y-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors ${isActive ? 'bg-ivory/10 text-ivory' : 'text-ivory/65 hover:text-ivory'}`}
            >
              <Icon size={16} strokeWidth={1.25} /> {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-ivory/10 px-3 py-4 text-[13px]">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 text-ivory/65 hover:text-ivory">
          <ExternalLink size={15} strokeWidth={1.25} /> View website
        </a>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 px-3 py-2 text-left text-ivory/65 hover:text-ivory">
          <LogOut size={15} strokeWidth={1.25} /> Sign out ({user.name.split(' ')[0]})
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-3 border-b border-line bg-ivory px-5 py-3 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="p-1" aria-label="Open admin menu">
            <Menu size={20} />
          </button>
          <span className="label-caps">RK FASHIONS Admin</span>
        </div>
        <main className="px-5 py-8 sm:px-8 lg:px-10">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductEditor />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="orders" element={<Orders />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="customers" element={<Customers />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="content" element={<Content />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
