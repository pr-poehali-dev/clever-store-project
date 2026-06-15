import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const Cabinet = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [savingNick, setSavingNick] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setNickname(user.nickname);
  }, [user, navigate]);

  if (!user) return null;

  const refresh = async () => {
    const res = await fetch(API.profile, {
      headers: { 'X-Auth-Token': user.token },
    });
    if (res.ok) {
      const data = await res.json();
      setUser({ ...data.user, token: user.token });
    }
  };

  const saveNick = async () => {
    setSavingNick(true);
    try {
      const res = await fetch(API.profile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': user.token },
        body: JSON.stringify({ action: 'update_nickname', nickname }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      setUser({ ...data.user, token: user.token });
      toast.success('Ник обновлён');
    } finally {
      setSavingNick(false);
    }
  };

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      try {
        const res = await fetch(API.profile, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': user.token },
          body: JSON.stringify({ action: 'update_avatar', image: base64, ext }),
        });
        const data = await res.json();
        if (!res.ok) return toast.error(data.error);
        setUser({ ...data.user, token: user.token });
        toast.success('Аватарка обновлена');
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const askAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiReply('');
    try {
      const res = await fetch(API.ai, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': user.token },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      setAiReply(data.reply);
      setUser({ ...user, clovers: data.clovers });
      toast.success('Списано 100 клеверов 💠');
    } catch {
      toast.error('ИИ недоступен');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg font-sans">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-clover/10">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display font-black text-xl">
            <span className="text-2xl">🍀</span>
            Клевер<span className="text-clover-grad">Маркет</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-clover/10 font-display font-bold text-clover-dark text-sm">
              💠 {user.clovers}
            </div>
            {user.is_admin && (
              <Link to="/admin">
                <Button variant="outline" className="rounded-full gap-1.5 border-clover/30">
                  <Icon name="Shield" size={16} /> Админка
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => { logout(); navigate('/'); }}
              className="rounded-full gap-1.5 text-muted-foreground"
            >
              <Icon name="LogOut" size={16} /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-10 max-w-3xl space-y-6">
        <h1 className="font-display font-black text-4xl tracking-tight">
          Личный кабинет
        </h1>

        {/* Profile card */}
        <div className="bg-background rounded-3xl border border-clover/10 shadow-sm p-6 md:p-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full clover-grad flex items-center justify-center overflow-hidden text-5xl shadow-lg shadow-clover/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  '🍀'
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-clover-dark text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                {uploadingAvatar ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : (
                  <Icon name="Camera" size={16} />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onAvatar} className="hidden" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-display font-bold text-2xl">{user.nickname}</p>
              <p className="text-muted-foreground">@{user.login}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-muted text-sm font-medium">
                <Icon name="Hash" size={14} className="text-clover" />
                ID участника: {user.id}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Изменить ник
            </label>
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-11 rounded-xl border-clover/20"
              />
              <Button
                onClick={saveNick}
                disabled={savingNick || nickname === user.nickname}
                className="clover-grad text-white rounded-xl px-6 font-display font-bold shrink-0"
              >
                {savingNick ? <Icon name="Loader2" size={18} className="animate-spin" /> : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>

        {/* AI helper — admin only */}
        {user.is_admin && (
          <div className="bg-gradient-to-br from-clover-dark to-clover text-white rounded-3xl shadow-xl shadow-clover/20 p-6 md:p-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Sparkles" size={22} />
              <h2 className="font-display font-black text-2xl">ИИ-помощник</h2>
              <span className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                только для вас
              </span>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Опишите, как изменить сайт. Каждый запрос — 100 клеверов 💠
            </p>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Например: сделай каталог в тёмной теме и добавь раздел отзывов"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl min-h-24 resize-none"
            />
            <Button
              onClick={askAi}
              disabled={aiLoading || !aiPrompt.trim() || user.clovers < 100}
              className="mt-4 bg-white text-clover-dark hover:bg-white/90 rounded-xl h-12 px-8 font-display font-bold w-full sm:w-auto"
            >
              {aiLoading ? (
                <Icon name="Loader2" size={20} className="animate-spin" />
              ) : (
                <>
                  <Icon name="Wand2" size={18} className="mr-2" />
                  Отправить за 100 💠
                </>
              )}
            </Button>
            {user.clovers < 100 && (
              <p className="text-white/70 text-xs mt-2">Недостаточно клеверов</p>
            )}
            {aiReply && (
              <div className="mt-5 bg-white/10 rounded-2xl p-4 whitespace-pre-wrap text-sm animate-fade-in">
                {aiReply}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cabinet;
