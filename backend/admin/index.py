"""
Админ-панель GTA Works.
GET /stats, GET /users, POST /users/{id}/block, POST /users/{id}/unblock,
GET /jobs, POST /jobs/{id}/block, POST /jobs/{id}/unblock,
GET /log
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
        CREATE TABLE IF NOT EXISTS {SCHEMA}.jobs (
            id SERIAL PRIMARY KEY, employer_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL, company VARCHAR(255) NOT NULL, city VARCHAR(100), spec VARCHAR(100),
            salary_min INTEGER, salary_max INTEGER, experience INTEGER DEFAULT 0,
            remote BOOLEAN NOT NULL DEFAULT FALSE, description TEXT,
            is_hot BOOLEAN NOT NULL DEFAULT FALSE, is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
            block_reason TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.resumes (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            position VARCHAR(255) NOT NULL, city VARCHAR(100), salary_expectation INTEGER,
            experience INTEGER DEFAULT 0, bio TEXT, remote BOOLEAN NOT NULL DEFAULT FALSE,
            is_available BOOLEAN NOT NULL DEFAULT TRUE, is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
            block_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.admin_log (
            id SERIAL PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES {SCHEMA}.users(id) ON DELETE CASCADE,
            action VARCHAR(100) NOT NULL, target_type VARCHAR(50) NOT NULL,
            target_id INTEGER NOT NULL, reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    conn.autocommit = False
    return conn

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
        "Content-Type": "application/json"
    }

def resp(status, body):
    return {"statusCode": status, "headers": cors(), "body": json.dumps(body, ensure_ascii=False, default=str)}

def get_admin(conn, token):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.role FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW() AND u.role = 'admin'
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "role": row[1]} if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

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
    conn.autocommit = False

    try:
        admin = get_admin(conn, token)
        if not admin:
            return resp(403, {"error": "Доступ запрещён. Только администраторы."})

        cur = conn.cursor()

        # GET /stats
        if method == "GET" and path.endswith("/stats"):
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE role='seeker'")
            seekers = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE role='employer'")
            employers = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_blocked=TRUE")
            blocked_users = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE is_active=TRUE AND is_blocked=FALSE")
            active_jobs = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE is_blocked=TRUE")
            blocked_jobs = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.resumes WHERE is_blocked=FALSE")
            resumes = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE created_at > NOW() - INTERVAL '7 days'")
            messages_week = cur.fetchone()[0]
            return resp(200, {
                "seekers": seekers, "employers": employers,
                "blocked_users": blocked_users, "active_jobs": active_jobs,
                "blocked_jobs": blocked_jobs, "resumes": resumes,
                "messages_week": messages_week
            })

        # GET /users
        if method == "GET" and path.endswith("/users"):
            cur.execute(f"""
                SELECT id, name, email, role, verified, is_blocked, block_reason, created_at
                FROM {SCHEMA}.users
                ORDER BY created_at DESC
                LIMIT 200
            """)
            rows = cur.fetchall()
            users = [{"id": r[0], "name": r[1], "email": r[2], "role": r[3],
                      "verified": r[4], "is_blocked": r[5], "block_reason": r[6], "created_at": r[7]}
                     for r in rows]
            return resp(200, {"users": users})

        # POST /users/{id}/block
        if method == "POST" and "/users/" in path and "/block" in path:
            parts = path.rstrip("/").split("/")
            uid = int(parts[-2])
            reason = body.get("reason", "Нарушение правил платформы")
            cur.execute(f"UPDATE {SCHEMA}.users SET is_blocked=TRUE, block_reason=%s WHERE id=%s AND role != 'admin'", (reason, uid))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'block_user','user',%s,%s)", (admin["id"], uid, reason))
            conn.commit()
            return resp(200, {"message": "Пользователь заблокирован"})

        # POST /users/{id}/unblock
        if method == "POST" and "/users/" in path and "/unblock" in path:
            parts = path.rstrip("/").split("/")
            uid = int(parts[-2])
            cur.execute(f"UPDATE {SCHEMA}.users SET is_blocked=FALSE, block_reason=NULL WHERE id=%s", (uid,))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'unblock_user','user',%s,'Разблокировано')", (admin["id"], uid))
            conn.commit()
            return resp(200, {"message": "Пользователь разблокирован"})

        # GET /jobs (все, включая заблокированные)
        if method == "GET" and path.endswith("/jobs"):
            cur.execute(f"""
                SELECT j.id, j.title, j.company, j.is_active, j.is_blocked, j.block_reason,
                       j.created_at, u.name as employer_name, u.email as employer_email
                FROM {SCHEMA}.jobs j
                JOIN {SCHEMA}.users u ON u.id = j.employer_id
                ORDER BY j.created_at DESC
                LIMIT 200
            """)
            rows = cur.fetchall()
            jobs = [{"id": r[0], "title": r[1], "company": r[2], "is_active": r[3],
                     "is_blocked": r[4], "block_reason": r[5], "created_at": r[6],
                     "employer_name": r[7], "employer_email": r[8]}
                    for r in rows]
            return resp(200, {"jobs": jobs})

        # POST /jobs/{id}/block
        if method == "POST" and "/jobs/" in path and "/block" in path:
            parts = path.rstrip("/").split("/")
            job_id = int(parts[-2])
            reason = body.get("reason", "Нарушение правил платформы")
            cur.execute(f"UPDATE {SCHEMA}.jobs SET is_blocked=TRUE, block_reason=%s WHERE id=%s", (reason, job_id))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'block_job','job',%s,%s)", (admin["id"], job_id, reason))
            conn.commit()
            return resp(200, {"message": "Вакансия заблокирована"})

        # POST /jobs/{id}/unblock
        if method == "POST" and "/jobs/" in path and "/unblock" in path:
            parts = path.rstrip("/").split("/")
            job_id = int(parts[-2])
            cur.execute(f"UPDATE {SCHEMA}.jobs SET is_blocked=FALSE, block_reason=NULL WHERE id=%s", (job_id,))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'unblock_job','job',%s,'Разблокировано')", (admin["id"], job_id))
            conn.commit()
            return resp(200, {"message": "Вакансия разблокирована"})

        # GET /log
        if method == "GET" and path.endswith("/log"):
            cur.execute(f"""
                SELECT l.id, l.action, l.target_type, l.target_id, l.reason, l.created_at,
                       u.name as admin_name
                FROM {SCHEMA}.admin_log l
                JOIN {SCHEMA}.users u ON u.id = l.admin_id
                ORDER BY l.created_at DESC
                LIMIT 100
            """)
            rows = cur.fetchall()
            logs = [{"id": r[0], "action": r[1], "target_type": r[2], "target_id": r[3],
                     "reason": r[4], "created_at": r[5], "admin_name": r[6]}
                    for r in rows]
            return resp(200, {"log": logs})

        return resp(404, {"error": "Метод не найден"})
    finally:
        conn.close()