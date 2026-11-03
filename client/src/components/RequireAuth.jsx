import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function RequireAuth({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="min-h-[60vh]" aria-busy="true" />;
  if (!user) return <Navigate to={`/account/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}
