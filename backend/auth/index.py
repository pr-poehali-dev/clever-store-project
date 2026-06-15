import json
import os
import hashlib
import secrets
import psycopg2


def _hash(password: str) -> str:
    return hashlib.sha256(('clover_salt_' + password).encode()).hexdigest()


def _user_dict(row):
    return {
        'id': row[0], 'login': row[1], 'nickname': row[2],
        'avatar_url': row[3], 'clovers': row[4],
        'is_admin': row[5], 'is_banned': row[6], 'token': row[7],
    }


def handler(event: dict, context) -> dict:
    '''Регистрация и вход участников магазина по логину и паролю'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')
    login = (body.get('login') or '').strip()
    password = body.get('password') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    if action == 'register':
        if len(login) < 3 or len(password) < 4:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors,
                    'body': json.dumps({'error': 'Логин от 3 символов, пароль от 4'})}
        login_esc = login.replace("'", "''")
        cur.execute(f"SELECT id FROM users WHERE login = '{login_esc}'")
        if cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': cors,
                    'body': json.dumps({'error': 'Логин уже занят'})}
        token = secrets.token_hex(24)
        ph = _hash(password)
        nick = login_esc
        cur.execute("SELECT COUNT(*) FROM users")
        is_first = cur.fetchone()[0] == 0
        admin_flag = 'TRUE' if is_first else 'FALSE'
        start_clovers = 1000 if is_first else 100
        cur.execute(
            f"INSERT INTO users (login, password_hash, nickname, clovers, token, is_admin) "
            f"VALUES ('{login_esc}', '{ph}', '{nick}', {start_clovers}, '{token}', {admin_flag}) "
            f"RETURNING id, login, nickname, avatar_url, clovers, is_admin, is_banned, token"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': cors,
                'body': json.dumps({'user': _user_dict(row)})}

    if action == 'login':
        login_esc = login.replace("'", "''")
        ph = _hash(password)
        cur.execute(
            f"SELECT id, login, nickname, avatar_url, clovers, is_admin, is_banned, token, password_hash "
            f"FROM users WHERE login = '{login_esc}'"
        )
        row = cur.fetchone()
        if not row or row[8] != ph:
            cur.close(); conn.close()
            return {'statusCode': 401, 'headers': cors,
                    'body': json.dumps({'error': 'Неверный логин или пароль'})}
        if row[6]:
            cur.close(); conn.close()
            return {'statusCode': 403, 'headers': cors,
                    'body': json.dumps({'error': 'Аккаунт заблокирован'})}
        token = secrets.token_hex(24)
        cur.execute(f"UPDATE users SET token = '{token}' WHERE id = {row[0]}")
        user = _user_dict(row[:8])
        user['token'] = token
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': cors,
                'body': json.dumps({'user': user})}

    cur.close(); conn.close()
    return {'statusCode': 400, 'headers': cors,
            'body': json.dumps({'error': 'Неизвестное действие'})}