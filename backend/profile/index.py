import json
import os
import base64
import uuid
import psycopg2
import boto3


def _auth_user(cur, token):
    if not token:
        return None
    token_esc = token.replace("'", "''")
    cur.execute(
        f"SELECT id, login, nickname, avatar_url, clovers, is_admin, is_banned, token "
        f"FROM users WHERE token = '{token_esc}'"
    )
    return cur.fetchone()


def _user_dict(row):
    return {
        'id': row[0], 'login': row[1], 'nickname': row[2],
        'avatar_url': row[3], 'clovers': row[4],
        'is_admin': row[5], 'is_banned': row[6], 'token': row[7],
    }


def handler(event: dict, context) -> dict:
    '''Личный кабинет: получение профиля, смена ника и аватарки, покупка товара'''
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

    user = _auth_user(cur, token)
    if not user:
        cur.close(); conn.close()
        return {'statusCode': 401, 'headers': cors,
                'body': json.dumps({'error': 'Не авторизован'})}
    if user[6]:
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': cors,
                'body': json.dumps({'error': 'Аккаунт заблокирован'})}

    uid = user[0]

    if method == 'GET':
        cur.execute("SELECT id, name, tags, price, emoji, rarity FROM products ORDER BY id")
        products = [
            {'id': r[0], 'name': r[1], 'tags': r[2].split(',') if r[2] else [],
             'price': r[3], 'emoji': r[4], 'rarity': r[5]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': cors,
                'body': json.dumps({'user': _user_dict(user), 'products': products})}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    if action == 'update_nickname':
        nick = (body.get('nickname') or '').strip()[:60]
        if len(nick) < 2:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors,
                    'body': json.dumps({'error': 'Ник от 2 символов'})}
        nick_esc = nick.replace("'", "''")
        cur.execute(f"UPDATE users SET nickname = '{nick_esc}' WHERE id = {uid}")

    elif action == 'update_avatar':
        image_b64 = body.get('image', '')
        if ',' in image_b64:
            image_b64 = image_b64.split(',', 1)[1]
        data = base64.b64decode(image_b64)
        ext = body.get('ext', 'png')
        key = f"avatars/{uid}_{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client(
            's3', endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=data,
                      ContentType=f'image/{ext}')
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.execute(f"UPDATE users SET avatar_url = '{url}' WHERE id = {uid}")

    elif action == 'buy':
        pid = int(body.get('product_id', 0))
        cur.execute(f"SELECT price, name FROM products WHERE id = {pid}")
        prod = cur.fetchone()
        if not prod:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': cors,
                    'body': json.dumps({'error': 'Товар не найден'})}
        if user[4] < prod[0]:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors,
                    'body': json.dumps({'error': 'Недостаточно клеверов'})}
        cur.execute(f"UPDATE users SET clovers = clovers - {prod[0]} WHERE id = {uid}")

    else:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'Неизвестное действие'})}

    fresh = _auth_user(cur, token)
    cur.close(); conn.close()
    return {'statusCode': 200, 'headers': cors,
            'body': json.dumps({'user': _user_dict(fresh)})}
