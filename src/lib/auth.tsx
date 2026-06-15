import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export const API = {
  auth: 'https://functions.poehali.dev/9ce9828e-6932-41d5-9d6c-b1af6c0a2885',
  profile: 'https://functions.poehali.dev/9dde8bfa-fe03-4b7b-b4e0-783515bef7af',
  admin: 'https://functions.poehali.dev/57a9089e-4de0-4da2-90bd-137b1eb91ea7',
  ai: 'https://functions.poehali.dev/de164408-7814-4ab1-a707-d9e2fc89de77',
};

export interface User {
  id: number;
  login: string;
  nickname: string;
  avatar_url: string | null;
  clovers: number;
  is_admin: boolean;
  is_banned: boolean;
  token: string;
}

interface AuthCtx {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('clover_user');
    if (saved) {
      try {
        setUserState(JSON.parse(saved));
      } catch {
        localStorage.removeItem('clover_user');
      }
    }
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem('clover_user', JSON.stringify(u));
    else localStorage.removeItem('clover_user');
  };

  const logout = () => setUser(null);

  return (
    <Ctx.Provider value={{ user, setUser, logout }}>{children}</Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
