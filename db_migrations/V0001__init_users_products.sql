CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(60) NOT NULL,
    avatar_url TEXT,
    clovers INTEGER NOT NULL DEFAULT 100,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    token VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0,
    emoji VARCHAR(16) NOT NULL DEFAULT '🍀',
    rarity VARCHAR(20) NOT NULL DEFAULT 'обычный',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO products (name, tags, price, emoji, rarity) VALUES
('Четырёхлистный талисман', 'удача,талисман,зелёный', 120, '🍀', 'легендарный'),
('Золотая монета фортуны', 'монета,золото,богатство', 80, '🪙', 'редкий'),
('Кристалл удачи', 'кристалл,магия,свет', 95, '💎', 'редкий'),
('Подкова на счастье', 'подкова,защита,талисман', 60, '🧲', 'обычный'),
('Звёздная пыль', 'пыль,магия,звезда', 150, '✨', 'легендарный'),
('Радужный шар', 'шар,радуга,цвет', 70, '🔮', 'обычный'),
('Изумрудный лист', 'лист,зелёный,природа', 45, '🌿', 'обычный'),
('Корона короля удачи', 'корона,золото,статус', 200, '👑', 'легендарный'),
('Волшебный гриб', 'гриб,магия,природа', 55, '🍄', 'обычный');