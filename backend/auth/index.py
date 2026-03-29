"""
Авторизация и регистрация пользователей GTA Works.
Методы: POST /register, POST /login, POST /verify, POST /logout, GET /me
"""
import json
import os
import hashlib
import secrets
import random
import string
from datetime import datetime, timedelta, timezone
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
        CREATE TABLE IF NOT EXISTS {SCHEMA}.user_skills (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            skill VARCHAR(100) NOT NULL
        )
    """)
    conn.autocommit = False
    return conn

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
        "Content-Type": "application/json"
    }

def resp(status, body):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps(body, ensure_ascii=False, default=str)}

def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def make_token():
    return secrets.token_hex(32)

def make_verify_code():
    return ''.join(random.choices(string.digits, k=6))

def get_user_by_token(conn, token):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.name, u.email, u.role, u.verified, u.is_blocked, u.city, u.bio, u.position, u.salary_min, u.salary_max, u.avatar_url
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0], "name": row[1], "email": row[2], "role": row[3],
        "verified": row[4], "is_blocked": row[5], "city": row[6],
        "bio": row[7], "position": row[8], "salary_min": row[9],
        "salary_max": row[10], "avatar_url": row[11]
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")

    conn = get_conn()
    try:
        # POST /register
        if method == "POST" and path.endswith("/register"):
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            role = body.get("role", "seeker")
            if role not in ("seeker", "employer"):
                role = "seeker"
            if not name or not email or not password:
                return resp(400, {"error": "Заполните все поля"})
            if len(password) < 6:
                return resp(400, {"error": "Пароль минимум 6 символов"})

            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return resp(409, {"error": "Email уже зарегистрирован"})

            pwd_hash = hash_password(password)
            code = make_verify_code()
            code_exp = datetime.now(timezone.utc) + timedelta(hours=1)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.users (name, email, password_hash, role, verify_code, verify_code_expires)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
            """, (name, email, pwd_hash, role, code, code_exp))
            user_id = cur.fetchone()[0]
            conn.commit()
            return resp(201, {"user_id": user_id, "verify_code": code, "message": "Код подтверждения отправлен"})

        # POST /verify
        if method == "POST" and path.endswith("/verify"):
            user_id = body.get("user_id")
            code = body.get("code", "").strip()
            if not user_id or not code:
                return resp(400, {"error": "Укажите user_id и код"})
            cur = conn.cursor()
            cur.execute(f"""
                SELECT id, verify_code, verify_code_expires FROM {SCHEMA}.users
                WHERE id = %s AND verified = FALSE
            """, (user_id,))
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "Пользователь не найден или уже подтверждён"})
            if row[1] != code:
                return resp(400, {"error": "Неверный код"})
            if row[2] and row[2] < datetime.now(timezone.utc):
                return resp(400, {"error": "Код истёк"})
            cur.execute(f"UPDATE {SCHEMA}.users SET verified = TRUE, verify_code = NULL WHERE id = %s", (user_id,))

            token_str = make_token()
            exp = datetime.now(timezone.utc) + timedelta(days=30)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, token_str, exp))
            conn.commit()

            cur.execute(f"SELECT id, name, email, role, verified, city, bio, position FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            u = cur.fetchone()
            return resp(200, {"token": token_str, "user": {"id": u[0], "name": u[1], "email": u[2], "role": u[3], "verified": u[4], "city": u[5], "bio": u[6], "position": u[7]}})

        # POST /login
        if method == "POST" and path.endswith("/login"):
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            if not email or not password:
                return resp(400, {"error": "Заполните email и пароль"})
            cur = conn.cursor()
            cur.execute(f"SELECT id, name, email, role, verified, is_blocked, block_reason FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s", (email, hash_password(password)))
            row = cur.fetchone()
            if not row:
                return resp(401, {"error": "Неверный email или пароль"})
            if row[5]:
                return resp(403, {"error": f"Аккаунт заблокирован. Причина: {row[6] or 'нарушение правил платформы'}"})

            token_str = make_token()
            exp = datetime.now(timezone.utc) + timedelta(days=30)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (row[0], token_str, exp))
            conn.commit()

            cur.execute(f"SELECT skill FROM {SCHEMA}.user_skills WHERE user_id = %s", (row[0],))
            skills = [r[0] for r in cur.fetchall()]
            return resp(200, {"token": token_str, "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[3], "verified": row[4], "skills": skills}})

        # GET /me
        if method == "GET" and path.endswith("/me"):
            if not token:
                return resp(401, {"error": "Не авторизован"})
            conn2 = get_conn()
            user = get_user_by_token(conn2, token)
            conn2.close()
            if not user:
                return resp(401, {"error": "Сессия истекла"})
            if user["is_blocked"]:
                return resp(403, {"error": "Аккаунт заблокирован"})
            return resp(200, {"user": user})

        # POST /logout
        if method == "POST" and path.endswith("/logout"):
            if token:
                cur = conn.cursor()
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return resp(200, {"message": "Выход выполнен"})

        return resp(404, {"error": "Метод не найден"})

    finally:
        conn.close()