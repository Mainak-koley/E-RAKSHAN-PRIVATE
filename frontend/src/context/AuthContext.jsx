import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../services/api/client';
import { loadLS, saveLS } from '../utils/storage';
import { ROLES } from '../constants/app';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadLS('session', null));

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login/', {
      email: email.toLowerCase().trim(),
      password,
    });

    if (response?.access) {
      localStorage.setItem('access_token', response.access);
    }

    if (response?.refresh) {
      localStorage.setItem('refresh_token', response.refresh);
    }

    const u = response?.user || response;

    setUser(u);
    saveLS('session', u);
    sessionStorage.setItem('sahay_just_logged_in', 'true');

    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveLS('session', null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  const can = useCallback(
    (roles) => !roles || !user || roles.includes(user.role),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      can,
      isAuthenticated: !!user,
      isCommander: user?.role === ROLES.COMMANDER,
    }),
    [user, login, logout, can]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}