// Authentication context — stores login state in sessionStorage
import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthUser {
  username: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  organization: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === '123456') {
      const u: AuthUser = {
        username: 'admin',
        name: '管理员',
        role: '超级管理员',
        email: 'admin@zhiguan.com',
        phone: '13800138000',
        organization: '智灌云科技有限公司',
      };
      setUser(u);
      sessionStorage.setItem('auth_user', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('auth_user');
  };

  return <AuthContext.Provider value={{ user, login, logout }} children={children} />;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
