import json
import os
import psycopg2


def _admin(cur, token):
    if not token:
        return None
    token_esc = token.replace("'", "''")
    cur.execute(f"SELECT id, is_admin FROM users WHERE token = '{token_esc}'")
    row = cur.fetchone()
    if not row or not row[1]:
        return None
    return row[0]


def handler(event: dict, context) -> dict:
    '''Админ-панель: участники, начисление клеверов, товары, блокировка'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    admin_id = _admin(cur, token)
    if not admin_id:
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': cors,
                'body': json.dumps({'error': 'Только для администратора'})}

    if method == 'GET':
        cur.execute(
            "SELECT id, login, nickname, avatar_url, clovers, is_admin, is_banned "
            "FROM users ORDER BY id"
        )
        users = [
            {'id': r[0], 'login': r[1], 'nickname': r[2], 'avatar_url': r[3],
             'clovers': r[4], 'is_admin': r[5], 'is_banned': r[6]}
            for r in cur.fetchall()
        ]
        cur.execute("SELECT id, name, tags, price, emoji, rarity FROM products ORDER BY id")
        products = [
            {'id': r[0], 'name': r[1], 'tags': r[2], 'price': r[3],
             'emoji': r[4], 'rarity': r[5]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': cors,
                'body': json.dumps({'users': users, 'products': products})}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    if action == 'set_clovers':
        uid = int(body.get('user_id', 0))
        amount = int(body.get('clovers', 0))
        cur.execute(f"UPDATE users SET clovers = {amount} WHERE id = {uid}")

    elif action == 'add_clovers':
        uid = int(body.get('user_id', 0))
        amount = int(body.get('amount', 0))
        cur.execute(f"UPDATE users SET clovers = GREATEST(0, clovers + {amount}) WHERE id = {uid}")

    elif action == 'toggle_ban':
        uid = int(body.get('user_id', 0))
        cur.execute(f"UPDATE users SET is_banned = NOT is_banned WHERE id = {uid} AND is_admin = FALSE")

    elif action == 'add_product':
        name = (body.get('name') or 'Новый товар').replace("'", "''")[:120]
        tags = (body.get('tags') or '').replace("'", "''")[:200]
        price = int(body.get('price', 0))
        emoji = (body.get('emoji') or '🍀')[:16]
        rarity = (body.get('rarity') or 'обычный').replace("'", "''")[:20]
        cur.execute(
            f"INSERT INTO products (name, tags, price, emoji, rarity) "
            f"VALUES ('{name}', '{tags}', {price}, '{emoji}', '{rarity}')"
        )

    elif action == 'update_product':
        pid = int(body.get('id', 0))
        name = (body.get('name') or '').replace("'", "''")[:120]
        tags = (body.get('tags') or '').replace("'", "''")[:200]
        price = int(body.get('price', 0))
        emoji = (body.get('emoji') or '🍀')[:16]
        rarity = (body.get('rarity') or 'обычный').replace("'", "''")[:20]
        cur.execute(
            f"UPDATE products SET name='{name}', tags='{tags}', price={price}, "
            f"emoji='{emoji}', rarity='{rarity}' WHERE id = {pid}"
        )

    elif action == 'delete_product':
        pid = int(body.get('id', 0))
        cur.execute(f"DELETE FROM products WHERE id = {pid}")

    else:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'Неизвестное действие'})}

    cur.close(); conn.close()
    return {'statusCode': 200, 'headers': cors,
            'body': json.dumps({'ok': True})}
