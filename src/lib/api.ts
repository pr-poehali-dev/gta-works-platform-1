// API client — URLs прошиты из func2url.json
const URLS: Record<string, string> = {
  auth: "https://functions.poehali.dev/f4c094ea-da93-45c4-b4f4-c6205db4c663",
  jobs: "https://functions.poehali.dev/87d1f370-46f2-4eb2-8731-630d8dd7a615",
  chat: "https://functions.poehali.dev/4a36f7f2-1840-48ac-a29f-7169b4506fa9",
  admin: "https://functions.poehali.dev/7faae6d0-d582-4d05-9ce9-c5650c95af15",
};

function url(name: string, path = "") {
  return URLS[name] + path;
}

function getToken(): string {
  return localStorage.getItem("gta_token") || "";
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || "Ошибка сервера", data };
  return data;
}

function get(endpoint: string, params?: Record<string, string>) {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  return request(endpoint + q);
}

function post(endpoint: string, body?: unknown) {
  return request(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined });
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; role: string }) =>
      post(url("auth", "/register"), data),
    verify: (data: { user_id: number; code: string }) =>
      post(url("auth", "/verify"), data),
    login: (data: { email: string; password: string }) =>
      post(url("auth", "/login"), data),
    me: () => get(url("auth", "/me")),
    logout: () => post(url("auth", "/logout")),
  },

  jobs: {
    list: (params?: Record<string, string>) => get(url("jobs"), params),
    create: (data: unknown) => post(url("jobs"), data),
  },

  chat: {
    contacts: () => get(url("chat", "/contacts")),
    messages: (withUserId: number) =>
      get(url("chat", "/messages"), { with: String(withUserId) }),
    send: (receiver_id: number, text: string) =>
      post(url("chat", "/send"), { receiver_id, text }),
  },

  admin: {
    stats: () => get(url("admin", "/stats")),
    users: () => get(url("admin", "/users")),
    jobs: () => get(url("admin", "/jobs")),
    log: () => get(url("admin", "/log")),
    blockUser: (id: number, reason: string) =>
      post(url("admin", `/users/${id}/block`), { reason }),
    unblockUser: (id: number) =>
      post(url("admin", `/users/${id}/unblock`)),
    blockJob: (id: number, reason: string) =>
      post(url("admin", `/jobs/${id}/block`), { reason }),
    unblockJob: (id: number) =>
      post(url("admin", `/jobs/${id}/unblock`)),
  },
};
