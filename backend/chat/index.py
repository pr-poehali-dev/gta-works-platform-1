"""
Чат GTA Works.
GET /contacts, GET /messages?with={user_id}, POST /send, POST /read
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p29631439_gta_works_platform_1")

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.users (
            id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'seeker', city VARCHAR(100),
            avatar_url TEXT, bio TEXT, position VARCHAR(255),
            salary_min INTEGER, salary_max INTEGER, verified BOOLEAN NOT NULL DEFAULT FALSE,
            verify_code VARCHAR(10), verify_code_expires TIMESTAMPTZ,
            is_blocked BOOLEAN NOT NULL DEFAULT FALSE, block_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.sessions (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            receiver_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            text TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    conn.autocommit = False
    return conn

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
        "Content-Type": "application/json"
    }

def resp(status, body):
    return {"statusCode": status, "headers": cors(), "body": json.dumps(body, ensure_ascii=False, default=str)}

def get_user(conn, token):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW() AND u.is_blocked = FALSE
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1], "role": row[2]} if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
    if not token:
        return resp(401, {"error": "Не авторизован"})

    conn = get_conn()
    conn.autocommit = False
    try:
        user = get_user(conn, token)
        if not user:
            return resp(401, {"error": "Сессия истекла или аккаунт заблокирован"})

        cur = conn.cursor()

        # GET /contacts
        if method == "GET" and path.endswith("/contacts"):
            cur.execute(f"""
                SELECT DISTINCT ON (other_id)
                    other_id,
                    other_name,
                    other_role,
                    last_msg,
                    last_time,
                    unread
                FROM (
                    SELECT
                        CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END AS other_id,
                        CASE WHEN m.sender_id = %s THEN ru.name ELSE su.name END AS other_name,
                        CASE WHEN m.sender_id = %s THEN ru.role ELSE su.role END AS other_role,
                        m.text AS last_msg,
                        m.created_at AS last_time,
                        COUNT(CASE WHEN m.receiver_id = %s AND m.is_read = FALSE THEN 1 END)
                            OVER (PARTITION BY CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END) AS unread
                    FROM {SCHEMA}.messages m
                    JOIN {SCHEMA}.users su ON su.id = m.sender_id
                    JOIN {SCHEMA}.users ru ON ru.id = m.receiver_id
                    WHERE m.sender_id = %s OR m.receiver_id = %s
                    ORDER BY m.created_at DESC
                ) sub
                ORDER BY other_id, last_time DESC
            """, (user["id"],) * 7)
            rows = cur.fetchall()
            contacts = [{"user_id": r[0], "name": r[1], "role": r[2], "last_msg": r[3], "last_time": r[4], "unread": r[5]} for r in rows]
            return resp(200, {"contacts": contacts})

        # GET /messages?with=id
        if method == "GET" and path.endswith("/messages"):
            with_id = params.get("with")
            if not with_id:
                return resp(400, {"error": "Укажите параметр with"})
            with_id = int(with_id)
            cur.execute(f"""
                SELECT id, sender_id, text, is_read, created_at
                FROM {SCHEMA}.messages
                WHERE (sender_id=%s AND receiver_id=%s) OR (sender_id=%s AND receiver_id=%s)
                ORDER BY created_at ASC
                LIMIT 100
            """, (user["id"], with_id, with_id, user["id"]))
            rows = cur.fetchall()
            messages = [{"id": r[0], "sender_id": r[1], "text": r[2], "is_read": r[3], "created_at": r[4]} for r in rows]
            # Mark as read
            cur.execute(f"UPDATE {SCHEMA}.messages SET is_read=TRUE WHERE sender_id=%s AND receiver_id=%s AND is_read=FALSE", (with_id, user["id"]))
            conn.commit()
            return resp(200, {"messages": messages})

        # POST /send
        if method == "POST" and path.endswith("/send"):
            receiver_id = body.get("receiver_id")
            text = body.get("text", "").strip()
            if not receiver_id or not text:
                return resp(400, {"error": "Укажите receiver_id и text"})
            cur.execute(f"INSERT INTO {SCHEMA}.messages (sender_id, receiver_id, text) VALUES (%s,%s,%s) RETURNING id, created_at", (user["id"], receiver_id, text))
            row = cur.fetchone()
            conn.commit()
            return resp(201, {"id": row[0], "created_at": row[1], "message": "Отправлено"})

        return resp(404, {"error": "Метод не найден"})
    finally:
        conn.close()