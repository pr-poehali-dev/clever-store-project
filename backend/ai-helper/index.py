import json
import os
import urllib.request
import psycopg2

AI_COST = 100


def handler(event: dict, context) -> dict:
    '''ИИ-помощник админа: принимает запрос на изменение сайта, списывает 100 клеверов'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return {'statusCode': 401, 'headers': cors,
                'body': json.dumps({'error': 'Не авторизован'})}

    body = json.loads(event.get('body') or '{}')
    prompt = (body.get('prompt') or '').strip()
    if not prompt:
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': 'Опишите, что изменить'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    token_esc = token.replace("'", "''")
    cur.execute(f"SELECT id, is_admin, clovers FROM users WHERE token = '{token_esc}'")
    row = cur.fetchone()
    if not row or not row[1]:
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': cors,
                'body': json.dumps({'error': 'ИИ-помощник доступен только администратору'})}

    uid, _, clovers = row
    if clovers < AI_COST:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': f'Нужно {AI_COST} клеверов, у вас {clovers}'})}

    reply = _ask_ai(prompt)

    cur.execute(f"UPDATE users SET clovers = clovers - {AI_COST} WHERE id = {uid}")
    cur.execute(f"SELECT clovers FROM users WHERE id = {uid}")
    new_balance = cur.fetchone()[0]
    cur.close(); conn.close()

    return {'statusCode': 200, 'headers': cors,
            'body': json.dumps({'reply': reply, 'clovers': new_balance})}


def _ask_ai(prompt: str) -> str:
    api_key = os.environ.get('OPENAI_API_KEY')
    system = (
        'Ты — ИИ-помощник владельца магазина «КлеверМаркет». '
        'Пользователь описывает, как он хочет изменить сайт. '
        'Подробно и понятно опиши план изменений простым языком, '
        'предложи конкретные шаги. Отвечай на русском, дружелюбно.'
    )
    if not api_key:
        return (
            'Принял запрос! Вот что я предлагаю сделать:\n\n'
            f'Ваша идея: «{prompt}»\n\n'
            '1. Опишу изменение детально\n2. Подготовлю макет\n3. Внесу правки в дизайн и логику\n\n'
            '(Чтобы я отвечал умнее — добавьте ключ OpenAI в настройках проекта.)'
        )
    try:
        req_body = json.dumps({
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            'temperature': 0.7,
        }).encode()
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=req_body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            },
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read())
        return data['choices'][0]['message']['content']
    except Exception as e:
        return f'Не удалось получить ответ ИИ: {str(e)[:120]}'
