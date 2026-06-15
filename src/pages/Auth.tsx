import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(API.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка');
        return;
      }
      setUser(data.user);
      toast.success(mode === 'login' ? 'С возвращением!' : 'Добро пожаловать!');
      navigate('/cabinet');
    } catch {
      toast.error('Не удалось подключиться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 font-display font-black text-2xl mb-8"
        >
          <span className="text-4xl animate-spin-slow inline-block">🍀</span>
          Клевер<span className="text-clover-grad">Маркет</span>
        </Link>

        <div className="bg-background rounded-3xl border border-clover/10 shadow-xl shadow-clover/10 p-8 animate-scale-in">
          <div className="flex gap-2 p-1 bg-muted rounded-2xl mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                  mode === m
                    ? 'bg-background shadow-sm text-clover-dark'
                    : 'text-muted-foreground'
                }`}
              >
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Логин
              </label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="ваш ник"
                className="h-12 rounded-xl border-clover/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Пароль
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="••••••"
                className="h-12 rounded-xl border-clover/20"
              />
            </div>
            <Button
              onClick={submit}
              disabled={loading || !login || !password}
              className="w-full clover-grad text-white rounded-xl h-12 font-display font-bold text-base shadow-lg shadow-clover/30 hover:opacity-90"
            >
              {loading ? (
                <Icon name="Loader2" size={20} className="animate-spin" />
              ) : mode === 'login' ? (
                'Войти'
              ) : (
                'Создать аккаунт'
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            🎁 Новым участникам — 100 клеверов в подарок
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-clover mt-6 transition-colors"
        >
          <Icon name="ArrowLeft" size={16} /> В магазин
        </Link>
      </div>
    </div>
  );
};

export default Auth;
