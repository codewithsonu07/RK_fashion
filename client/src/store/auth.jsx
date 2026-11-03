import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setStatus('ready'));
  }, []);

  const login = useCallback(async (body) => {
    const { user } = await api.login(body);
    setUser(user);
    return user;
  }, []);
  const register = useCallback(async (body) => {
    const { user } = await api.register(body);
    setUser(user);
    return user;
  }, []);
  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);
  const updateProfile = useCallback(async (body) => {
    const { user } = await api.updateProfile(body);
    setUser(user);
    return user;
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout, updateProfile, setUser }), [user, status, login, register, logout, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
