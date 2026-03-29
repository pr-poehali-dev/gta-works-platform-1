"""
Вакансии GTA Works: список, создание, фильтрация, отклик, блокировка.
GET /, POST /, PUT /{id}, POST /{id}/block, POST /{id}/unblock
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
        CREATE TABLE IF NOT EXISTS {SCHEMA}.job_skills (
            id SERIAL PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES {SCHEMA}.jobs(id) ON DELETE CASCADE,
            skill VARCHAR(100) NOT NULL
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

def get_user_by_token(conn, token):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT u.id, u.role, u.is_blocked FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "role": row[1], "is_blocked": row[2]} if row else None

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
    conn = get_conn()
    conn.autocommit = False

    try:
        # GET / — список вакансий
        if method == "GET" and not any(x in path for x in ["/block", "/unblock"]) and ("/" == path or path.endswith("/jobs") or path.endswith("/jobs/")):
            spec = params.get("spec")
            search = params.get("search")
            salary_min = params.get("salary_min")
            salary_max = params.get("salary_max")
            remote_only = params.get("remote") == "true"
            exp_max = params.get("exp_max")

            where = [f"j.is_active = TRUE AND j.is_blocked = FALSE"]
            args = []
            if spec:
                where.append("j.spec = %s")
                args.append(spec)
            if search:
                where.append("(j.title ILIKE %s OR j.company ILIKE %s)")
                args += [f"%{search}%", f"%{search}%"]
            if salary_min:
                where.append("j.salary_max >= %s")
                args.append(int(salary_min))
            if salary_max:
                where.append("j.salary_min <= %s")
                args.append(int(salary_max))
            if remote_only:
                where.append("j.remote = TRUE")
            if exp_max:
                where.append("j.experience <= %s")
                args.append(int(exp_max))

            cur = conn.cursor()
            q = f"""
                SELECT j.id, j.title, j.company, j.city, j.spec, j.salary_min, j.salary_max,
                       j.experience, j.remote, j.description, j.is_hot, j.created_at,
                       COALESCE(array_agg(js.skill) FILTER (WHERE js.skill IS NOT NULL), ARRAY[]::text[]) as skills
                FROM {SCHEMA}.jobs j
                LEFT JOIN {SCHEMA}.job_skills js ON js.job_id = j.id
                WHERE {' AND '.join(where)}
                GROUP BY j.id
                ORDER BY j.is_hot DESC, j.created_at DESC
                LIMIT 100
            """
            cur.execute(q, args)
            rows = cur.fetchall()
            jobs = []
            for r in rows:
                jobs.append({
                    "id": r[0], "title": r[1], "company": r[2], "city": r[3],
                    "spec": r[4], "salary_min": r[5], "salary_max": r[6],
                    "experience": r[7], "remote": r[8], "description": r[9],
                    "is_hot": r[10], "created_at": r[11], "skills": list(r[12]) if r[12] else []
                })
            return resp(200, {"jobs": jobs, "total": len(jobs)})

        # POST / — создать вакансию
        if method == "POST" and not any(x in path for x in ["/block", "/unblock"]) and ("/" == path or path.endswith("/jobs") or path.endswith("/jobs/")):
            if not token:
                return resp(401, {"error": "Не авторизован"})
            user = get_user_by_token(conn, token)
            if not user or user["role"] not in ("employer", "admin"):
                return resp(403, {"error": "Только работодатели могут создавать вакансии"})
            if user["is_blocked"]:
                return resp(403, {"error": "Аккаунт заблокирован"})

            title = body.get("title", "").strip()
            company = body.get("company", "").strip()
            if not title or not company:
                return resp(400, {"error": "Укажите название и компанию"})

            cur = conn.cursor()
            cur.execute(f"""
                INSERT INTO {SCHEMA}.jobs (employer_id, title, company, city, spec, salary_min, salary_max, experience, remote, description, is_hot)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (
                user["id"], title, company,
                body.get("city"), body.get("spec"), body.get("salary_min"),
                body.get("salary_max"), body.get("experience", 0),
                body.get("remote", False), body.get("description"), body.get("is_hot", False)
            ))
            job_id = cur.fetchone()[0]
            for skill in body.get("skills", []):
                cur.execute(f"INSERT INTO {SCHEMA}.job_skills (job_id, skill) VALUES (%s, %s)", (job_id, skill))
            conn.commit()
            return resp(201, {"id": job_id, "message": "Вакансия создана"})

        # POST /{id}/block — заблокировать вакансию (admin)
        if method == "POST" and "/block" in path:
            if not token:
                return resp(401, {"error": "Не авторизован"})
            user = get_user_by_token(conn, token)
            if not user or user["role"] != "admin":
                return resp(403, {"error": "Только администраторы"})
            parts = path.rstrip("/").split("/")
            job_id = int(parts[-2]) if parts[-1] == "block" else int(parts[-1])
            reason = body.get("reason", "Нарушение правил платформы")
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.jobs SET is_blocked=TRUE, block_reason=%s WHERE id=%s", (reason, job_id))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'block','job',%s,%s)", (user["id"], job_id, reason))
            conn.commit()
            return resp(200, {"message": "Вакансия заблокирована"})

        # POST /{id}/unblock — разблокировать (admin)
        if method == "POST" and "/unblock" in path:
            if not token:
                return resp(401, {"error": "Не авторизован"})
            user = get_user_by_token(conn, token)
            if not user or user["role"] != "admin":
                return resp(403, {"error": "Только администраторы"})
            parts = path.rstrip("/").split("/")
            job_id = int(parts[-2]) if parts[-1] == "unblock" else int(parts[-1])
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.jobs SET is_blocked=FALSE, block_reason=NULL WHERE id=%s", (job_id,))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_log (admin_id, action, target_type, target_id, reason) VALUES (%s,'unblock','job',%s,'Разблокировано администратором')", (user["id"], job_id))
            conn.commit()
            return resp(200, {"message": "Вакансия разблокирована"})

        return resp(404, {"error": "Метод не найден"})
    finally:
        conn.close()