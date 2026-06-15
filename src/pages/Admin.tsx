import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  login: string;
  nickname: string;
  avatar_url: string | null;
  clovers: number;
  is_admin: boolean;
  is_banned: boolean;
}
interface AdminProduct {
  id: number;
  name: string;
  tags: string;
  price: number;
  emoji: string;
  rarity: string;
}

const empty = { name: '', tags: '', price: 0, emoji: '🍀', rarity: 'обычный' };

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'users' | 'products'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [newProduct, setNewProduct] = useState(empty);

  useEffect(() => {
    if (!user) return navigate('/auth');
    if (!user.is_admin) return navigate('/cabinet');
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const res = await fetch(API.admin, { headers: { 'X-Auth-Token': user.token } });
    if (!res.ok) return toast.error('Нет доступа');
    const data = await res.json();
    setUsers(data.users);
    setProducts(data.products);
  };

  const act = async (payload: object, msg?: string) => {
    if (!user) return;
    const res = await fetch(API.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': user.token },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json();
      return toast.error(d.error || 'Ошибка');
    }
    if (msg) toast.success(msg);
    load();
  };

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen mesh-bg font-sans">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-clover/10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-display font-black text-xl">
            <Icon name="Shield" size={22} className="text-clover" />
            Админ-панель
          </div>
          <Link to="/cabinet">
            <Button variant="ghost" className="rounded-full gap-1.5">
              <Icon name="ArrowLeft" size={16} /> В кабинет
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-5xl">
        <div className="flex gap-2 p-1 bg-muted rounded-2xl mb-6 w-fit">
          {(['users', 'products'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                tab === t ? 'bg-background shadow-sm text-clover-dark' : 'text-muted-foreground'
              }`}
            >
              {t === 'users' ? `Участники (${users.length})` : `Товары (${products.length})`}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className={`bg-background rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  u.is_banned ? 'border-destructive/40 opacity-70' : 'border-clover/10'
                }`}
              >
                <div className="w-12 h-12 rounded-full clover-grad flex items-center justify-center overflow-hidden text-xl shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : '🍀'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold flex items-center gap-2">
                    {u.nickname}
                    {u.is_admin && (
                      <span className="text-xs bg-clover/15 text-clover-dark px-2 py-0.5 rounded-full">админ</span>
                    )}
                    {u.is_banned && (
                      <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">бан</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">@{u.login} · ID {u.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg w-9 px-0"
                    onClick={() => act({ action: 'add_clovers', user_id: u.id, amount: -10 })}>
                    −10
                  </Button>
                  <span className="font-display font-bold text-clover-dark w-20 text-center">💠 {u.clovers}</span>
                  <Button size="sm" variant="outline" className="rounded-lg w-9 px-0"
                    onClick={() => act({ action: 'add_clovers', user_id: u.id, amount: 10 })}>
                    +10
                  </Button>
                  {!u.is_admin && (
                    <Button size="sm" variant={u.is_banned ? 'outline' : 'destructive'} className="rounded-lg"
                      onClick={() => act({ action: 'toggle_ban', user_id: u.id }, u.is_banned ? 'Разблокирован' : 'Заблокирован')}>
                      <Icon name={u.is_banned ? 'Unlock' : 'Ban'} size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-6">
            <div className="bg-background rounded-2xl border border-clover/10 p-5">
              <p className="font-display font-bold mb-3">Добавить товар</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Input placeholder="Эмодзи" value={newProduct.emoji}
                  onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })} className="rounded-lg" />
                <Input placeholder="Название" value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="rounded-lg col-span-2 sm:col-span-2" />
                <Input placeholder="Теги через запятую" value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })} className="rounded-lg col-span-2 sm:col-span-1" />
                <Input type="number" placeholder="Цена" value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: +e.target.value })} className="rounded-lg" />
              </div>
              <Button className="mt-3 clover-grad text-white rounded-lg font-display font-bold"
                onClick={() => { act(newProduct.name ? { action: 'add_product', ...newProduct } : {}, 'Товар добавлен'); setNewProduct(empty); }}>
                <Icon name="Plus" size={16} className="mr-1" /> Добавить
              </Button>
            </div>

            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="bg-background rounded-2xl border border-clover/10 p-4 flex items-center gap-4">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.tags} · {p.rarity}</p>
                  </div>
                  <span className="font-display font-bold text-clover-dark">💠 {p.price}</span>
                  <Button size="sm" variant="destructive" className="rounded-lg"
                    onClick={() => act({ action: 'delete_product', id: p.id }, 'Товар удалён')}>
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
