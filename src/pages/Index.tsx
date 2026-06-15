import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Product {
  id: number;
  name: string;
  tags: string[];
  price: number;
  emoji: string;
  rarity: 'обычный' | 'редкий' | 'легендарный';
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Четырёхлистный талисман', tags: ['удача', 'талисман', 'зелёный'], price: 120, emoji: '🍀', rarity: 'легендарный' },
  { id: 2, name: 'Золотая монета фортуны', tags: ['монета', 'золото', 'богатство'], price: 80, emoji: '🪙', rarity: 'редкий' },
  { id: 3, name: 'Кристалл удачи', tags: ['кристалл', 'магия', 'свет'], price: 95, emoji: '💎', rarity: 'редкий' },
  { id: 4, name: 'Подкова на счастье', tags: ['подкова', 'защита', 'талисман'], price: 60, emoji: '🧲', rarity: 'обычный' },
  { id: 5, name: 'Звёздная пыль', tags: ['пыль', 'магия', 'звезда'], price: 150, emoji: '✨', rarity: 'легендарный' },
  { id: 6, name: 'Радужный шар', tags: ['шар', 'радуга', 'цвет'], price: 70, emoji: '🔮', rarity: 'обычный' },
  { id: 7, name: 'Изумрудный лист', tags: ['лист', 'зелёный', 'природа'], price: 45, emoji: '🌿', rarity: 'обычный' },
  { id: 8, name: 'Корона короля удачи', tags: ['корона', 'золото', 'статус'], price: 200, emoji: '👑', rarity: 'легендарный' },
  { id: 9, name: 'Волшебный гриб', tags: ['гриб', 'магия', 'природа'], price: 55, emoji: '🍄', rarity: 'обычный' },
];

const rarityColor: Record<Product['rarity'], string> = {
  'обычный': 'bg-muted text-muted-foreground',
  'редкий': 'bg-clover-light/20 text-clover-dark',
  'легендарный': 'bg-gradient-to-r from-clover to-lime text-white',
};

const Index = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const balance = user?.clovers ?? 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.rarity.includes(q)
    );
  }, [query]);

  const addToCart = (p: Product) => setCart((c) => [...c, p]);
  const removeFromCart = (idx: number) =>
    setCart((c) => c.filter((_, i) => i !== idx));
  const cartTotal = cart.reduce((s, p) => s + p.price, 0);

  return (
    <div className="min-h-screen mesh-bg font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-clover/10">
        <div className="container flex items-center justify-between h-18 py-3">
          <a href="#" className="flex items-center gap-2 font-display font-black text-xl">
            <span className="text-3xl animate-spin-slow inline-block">🍀</span>
            <span>Клевер<span className="text-clover-grad">Маркет</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#hero" className="hover:text-clover transition-colors">Главная</a>
            <a href="#catalog" className="hover:text-clover transition-colors">Каталог</a>
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-clover/10 font-display font-bold text-clover-dark text-sm">
                <span>💠</span> {balance}
              </div>
            )}
            {user ? (
              <Link to="/cabinet">
                <Button variant="outline" className="rounded-full gap-2 border-clover/30 font-display font-bold">
                  <div className="w-6 h-6 rounded-full clover-grad flex items-center justify-center overflow-hidden text-xs">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : '🍀'}
                  </div>
                  <span className="hidden sm:inline">{user.nickname}</span>
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" className="rounded-full gap-1.5 border-clover/30 font-display font-bold">
                  <Icon name="User" size={16} /> Войти
                </Button>
              </Link>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button className="clover-grad text-white rounded-full gap-2 font-display font-bold shadow-lg shadow-clover/30 hover:opacity-90">
                  <Icon name="ShoppingBag" size={18} />
                  {cart.length > 0 && (
                    <span className="bg-white text-clover-dark rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-display text-2xl">Корзина</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-4 space-y-3">
                  {cart.length === 0 && (
                    <div className="text-center text-muted-foreground py-16">
                      <div className="text-5xl mb-3">🛒</div>
                      Корзина пуста
                    </div>
                  )}
                  {cart.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50"
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-clover-dark font-display font-bold text-sm">
                          💠 {p.price}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Icon name="X" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 mt-4 space-y-3">
                  <div className="flex justify-between font-display font-bold text-lg">
                    <span>Итого</span>
                    <span className="text-clover-dark">💠 {cartTotal}</span>
                  </div>
                  <Button
                    disabled={cart.length === 0}
                    className="w-full clover-grad text-white rounded-full font-display font-bold h-12 text-base shadow-lg shadow-clover/30"
                  >
                    Оформить за клеверы
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="container relative pt-16 pb-12 md:pt-24 md:pb-20 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-clover/10 text-clover-dark text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-clover animate-pulse" />
              Магазин редких вещей за клеверы
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Трать <span className="text-clover-grad">клеверы</span><br />на удачу
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-md">
              Собирай клеверы и обменивай их на редкие талисманы, кристаллы и
              легендарные предметы. Найди свою удачу за секунды.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#catalog">
                <Button className="clover-grad text-white rounded-full h-13 px-8 font-display font-bold text-base shadow-xl shadow-clover/30 hover:opacity-90">
                  Открыть каталог
                  <Icon name="ArrowRight" size={18} className="ml-1" />
                </Button>
              </a>
              <div className="flex items-center gap-2 px-5 rounded-full bg-background border border-clover/20 font-display font-bold text-clover-dark">
                💠 {balance} клеверов
              </div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 clover-grad blur-3xl opacity-30 rounded-full" />
            <img
              src="https://cdn.poehali.dev/projects/3a028aed-e9b2-49f5-8352-8e76314f9ec1/files/0acb493f-cce1-41ad-9b07-87ed76a84689.jpg"
              alt="Клевер удачи"
              className="relative w-72 md:w-96 rounded-[2rem] shadow-2xl shadow-clover/20 animate-float"
            />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="container pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight">
              Каталог
            </h2>
            <p className="text-muted-foreground mt-2">
              {filtered.length} {filtered.length === 1 ? 'товар' : 'товаров'} доступно
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Icon
              name="Search"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-clover"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или тегам..."
              className="pl-12 h-13 rounded-full border-clover/20 bg-background shadow-sm focus-visible:ring-clover text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={18} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-display font-bold text-xl">Ничего не найдено</p>
            <p>Попробуйте изменить запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="group relative rounded-3xl bg-background border border-clover/10 p-6 shadow-sm hover:shadow-xl hover:shadow-clover/10 hover:-translate-y-1 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className={`absolute top-5 right-5 text-xs font-bold px-3 py-1 rounded-full ${rarityColor[p.rarity]}`}
                >
                  {p.rarity}
                </span>
                <div className="text-7xl mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 inline-block">
                  {p.emoji}
                </div>
                <h3 className="font-display font-bold text-lg leading-tight">
                  {p.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-3 mb-5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-xl text-clover-dark">
                    💠 {p.price}
                  </span>
                  <Button
                    onClick={() => addToCart(p)}
                    className="clover-grad text-white rounded-full gap-1.5 font-display font-bold shadow-md shadow-clover/20 hover:opacity-90"
                  >
                    <Icon name="Plus" size={16} />В корзину
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="clover-grad text-white">
        <div className="container py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-black text-xl">
            <span className="text-2xl">🍀</span> КлеверМаркет
          </div>
          <p className="text-white/80 text-sm">
            © 2026 КлеверМаркет — удача за клеверы 💠
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;