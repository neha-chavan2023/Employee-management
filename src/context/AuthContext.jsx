import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';

const AuthContext = createContext(null);

const hydrate = (session) => {
  if (!session) return null;
  const employee = employeeService.getByCode(session.employeeCode);
  return { ...session, employeeId: employee?.id || '' };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => hydrate(authService.getSession()));

  const login = useCallback((email, password, remember) => {
    const session = authService.login(email, password, remember);
    const nextUser = hydrate(session);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => Boolean(user && roles.includes(user.role)), [user]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      hasRole,
      isAdmin: user?.role === 'admin',
      isHR: user?.role === 'hr',
      isEmployee: user?.role === 'employee',
      canManage: Boolean(user && ['admin', 'hr'].includes(user.role)),
    }),
    [user, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
