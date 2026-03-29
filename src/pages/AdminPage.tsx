import { useState, useEffect } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

interface Props { user: User; }

interface AdminUser {
  id: number; name: string; email: string; role: string;
  verified: boolean; is_blocked: boolean; block_reason?: string; created_at: string;
}
interface AdminJob {
  id: number; title: string; company: string; is_active: boolean;
  is_blocked: boolean; block_reason?: string; created_at: string;
  employer_name: string; employer_email: string;
}
interface AdminStats {
  seekers: number; employers: number; blocked_users: number;
  active_jobs: number; blocked_jobs: number; resumes: number; messages_week: number;
}
interface LogEntry {
  id: number; action: string; target_type: string; target_id: number;
  reason: string; created_at: string; admin_name: string;
}

type AdminTab = "dashboard" | "users" | "jobs" | "log";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  block_user: { label: "Блок. пользователя", color: "text-neon-pink" },
  unblock_user: { label: "Разблок. пользователя", color: "text-neon-green" },
  block_job: { label: "Блок. вакансии", color: "text-neon-pink" },
  unblock_job: { label: "Разблок. вакансии", color: "text-neon-green" },
  block: { label: "Блокировка", color: "text-neon-pink" },
  unblock: { label: "Разблокировка", color: "text-neon-green" },
};

export default function AdminPage({ user }: Props) {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockModal, setBlockModal] = useState<{ type: "user" | "job"; id: number; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "jobs") loadJobs();
    if (tab === "log") loadLog();
  }, [tab]);

  async function loadStats() {
    try {
      const data = await api.admin.stats();
      setStats(data);
    } catch (e) { console.error(e); }
  }
  async function loadUsers() {
    setLoading(true);
    try { const d = await api.admin.users(); setUsers(d.users || []); }
    finally { setLoading(false); }
  }
  async function loadJobs() {
    setLoading(true);
    try { const d = await api.admin.jobs(); setJobs(d.jobs || []); }
    finally { setLoading(false); }
  }
  async function loadLog() {
    setLoading(true);
    try { const d = await api.admin.log(); setLog(d.log || []); }
    finally { setLoading(false); }
  }

  async function blockEntity() {
    if (!blockModal) return;
    try {
      if (blockModal.type === "user") {
        await api.admin.blockUser(blockModal.id, blockReason || "Нарушение правил платформы");
        setUsers((u) => u.map((x) => x.id === blockModal.id ? { ...x, is_blocked: true, block_reason: blockReason } : x));
      } else {
        await api.admin.blockJob(blockModal.id, blockReason || "Нарушение правил платформы");
        setJobs((j) => j.map((x) => x.id === blockModal.id ? { ...x, is_blocked: true, block_reason: blockReason } : x));
      }
    } finally { setBlockModal(null); setBlockReason(""); loadStats(); }
  }

  async function unblock(type: "user" | "job", id: number) {
    try {
      if (type === "user") {
        await api.admin.unblockUser(id);
        setUsers((u) => u.map((x) => x.id === id ? { ...x, is_blocked: false, block_reason: undefined } : x));
      } else {
        await api.admin.unblockJob(id);
        setJobs((j) => j.map((x) => x.id === id ? { ...x, is_blocked: false, block_reason: undefined } : x));
      }
      loadStats();
    } catch (e) { console.error(e); }
  }

  const filteredUsers = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredJobs = jobs.filter((j) =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { id: "users", label: "Пользователи", icon: "Users" },
    { id: "jobs", label: "Вакансии", icon: "Briefcase" },
    { id: "log", label: "Журнал", icon: "ScrollText" },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neon-pink/15 border border-neon-pink/30 flex items-center justify-center">
          <Icon name="ShieldAlert" size={20} className="text-neon-pink" />
        </div>
        <div>
          <h1 className="font-unbounded font-black text-2xl text-foreground">Панель администратора</h1>
          <p className="text-muted-foreground text-sm">Управление пользователями и контентом платформы</p>
        </div>
        <span className="ml-auto text-xs bg-neon-pink/10 text-neon-pink border border-neon-pink/20 px-3 py-1.5 rounded-full font-bold">
          ADMIN
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border p-1 rounded-xl mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.id ? "bg-neon-pink text-white font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Соискателей", value: stats?.seekers ?? "—", icon: "User", color: "text-neon-green", bg: "bg-neon-green/10 border-neon-green/20" },
              { label: "Работодателей", value: stats?.employers ?? "—", icon: "Building2", color: "text-neon-blue", bg: "bg-neon-blue/10 border-neon-blue/20" },
              { label: "Активных вакансий", value: stats?.active_jobs ?? "—", icon: "Briefcase", color: "text-neon-purple", bg: "bg-neon-purple/10 border-neon-purple/20" },
              { label: "Резюме", value: stats?.resumes ?? "—", icon: "FileText", color: "text-foreground", bg: "bg-muted border-border" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border rounded-2xl p-5 card-hover`}>
                <Icon name={s.icon} size={20} className={`${s.color} mb-3`} />
                <p className={`font-unbounded font-black text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-neon-pink/10 border border-neon-pink/20 rounded-2xl p-5">
              <Icon name="Ban" size={20} className="text-neon-pink mb-3" />
              <p className="font-unbounded font-black text-2xl text-neon-pink">{stats?.blocked_users ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Заблокированных пользователей</p>
            </div>
            <div className="bg-neon-pink/10 border border-neon-pink/20 rounded-2xl p-5">
              <Icon name="EyeOff" size={20} className="text-neon-pink mb-3" />
              <p className="font-unbounded font-black text-2xl text-neon-pink">{stats?.blocked_jobs ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Заблокированных вакансий</p>
            </div>
            <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-2xl p-5">
              <Icon name="MessageCircle" size={20} className="text-neon-blue mb-3" />
              <p className="font-unbounded font-black text-2xl text-neon-blue">{stats?.messages_week ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Сообщений за 7 дней</p>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="animate-fade-in space-y-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-pink transition-colors"
            />
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u, i) => (
                <div key={u.id} className={`bg-card border rounded-2xl p-5 flex items-center gap-4 animate-fade-in ${u.is_blocked ? "border-neon-pink/30 bg-neon-pink/5" : "border-border"}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.is_blocked ? "bg-neon-pink/20 text-neon-pink" : "bg-gradient-to-br from-neon-green/30 to-neon-purple/20 text-foreground"}`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{u.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        u.role === "admin" ? "bg-neon-pink/15 text-neon-pink border-neon-pink/25"
                        : u.role === "employer" ? "bg-neon-blue/10 text-neon-blue border-neon-blue/20"
                        : "bg-neon-green/10 text-neon-green border-neon-green/20"
                      }`}>
                        {u.role === "admin" ? "Администратор" : u.role === "employer" ? "Работодатель" : "Соискатель"}
                      </span>
                      {u.is_blocked && <span className="text-[10px] bg-neon-pink/15 text-neon-pink border border-neon-pink/25 px-2 py-0.5 rounded-full">🚫 Заблокирован</span>}
                      {!u.verified && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">Не верифицирован</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                    {u.is_blocked && u.block_reason && (
                      <p className="text-xs text-neon-pink mt-1">Причина: {u.block_reason}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                    <p>{new Date(u.created_at).toLocaleDateString("ru")}</p>
                    {u.role !== "admin" && (
                      <div className="mt-2">
                        {u.is_blocked ? (
                          <button
                            onClick={() => unblock("user", u.id)}
                            className="flex items-center gap-1 text-neon-green hover:underline text-xs"
                          >
                            <Icon name="ShieldCheck" size={12} /> Разблокировать
                          </button>
                        ) : (
                          <button
                            onClick={() => setBlockModal({ type: "user", id: u.id, name: u.name })}
                            className="flex items-center gap-1 text-neon-pink hover:underline text-xs"
                          >
                            <Icon name="Ban" size={12} /> Заблокировать
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jobs */}
      {tab === "jobs" && (
        <div className="animate-fade-in space-y-4">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по вакансии или компании..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-pink transition-colors"
            />
          </div>
          {loading ? (
            <div className="text-center py-12"><Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((j, i) => (
                <div key={j.id} className={`bg-card border rounded-2xl p-5 flex items-center gap-4 animate-fade-in ${j.is_blocked ? "border-neon-pink/30 bg-neon-pink/5" : "border-border"}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${j.is_blocked ? "bg-neon-pink/15" : "bg-muted"}`}>
                    <Icon name="Briefcase" size={18} className={j.is_blocked ? "text-neon-pink" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{j.title}</p>
                      {j.is_blocked && <span className="text-[10px] bg-neon-pink/15 text-neon-pink border border-neon-pink/25 px-2 py-0.5 rounded-full">🚫 Заблокирована</span>}
                      {!j.is_active && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">Неактивна</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{j.company} · {j.employer_name}</p>
                    {j.is_blocked && j.block_reason && (
                      <p className="text-xs text-neon-pink mt-1">Причина: {j.block_reason}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                    <p>{new Date(j.created_at).toLocaleDateString("ru")}</p>
                    <div className="mt-2">
                      {j.is_blocked ? (
                        <button
                          onClick={() => unblock("job", j.id)}
                          className="flex items-center gap-1 text-neon-green hover:underline text-xs"
                        >
                          <Icon name="ShieldCheck" size={12} /> Разблокировать
                        </button>
                      ) : (
                        <button
                          onClick={() => setBlockModal({ type: "job", id: j.id, name: j.title })}
                          className="flex items-center gap-1 text-neon-pink hover:underline text-xs"
                        >
                          <Icon name="Ban" size={12} /> Заблокировать
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {tab === "log" && (
        <div className="animate-fade-in space-y-3">
          {loading ? (
            <div className="text-center py-12"><Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" /></div>
          ) : log.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="ScrollText" size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-unbounded font-bold">Журнал пуст</p>
            </div>
          ) : (
            log.map((l, i) => {
              const meta = ACTION_LABELS[l.action] || { label: l.action, color: "text-foreground" };
              return (
                <div key={l.id} className="bg-card border border-border rounded-xl px-5 py-3.5 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon name={l.action.includes("block") && !l.action.includes("unblock") ? "Ban" : "ShieldCheck"} size={15} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-muted-foreground">{l.target_type} #{l.target_id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="text-foreground">{l.admin_name}</span> · {l.reason}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex-shrink-0">
                    {new Date(l.created_at).toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Block modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-neon-pink/15 flex items-center justify-center">
                <Icon name="Ban" size={20} className="text-neon-pink" />
              </div>
              <div>
                <h3 className="font-unbounded font-bold text-base text-foreground">Заблокировать</h3>
                <p className="text-xs text-muted-foreground">{blockModal.name}</p>
              </div>
            </div>
            <label className="text-sm text-muted-foreground mb-2 block">Причина блокировки</label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Опишите причину нарушения..."
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-pink resize-none transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setBlockModal(null); setBlockReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
              >
                Отмена
              </button>
              <button
                onClick={blockEntity}
                className="flex-1 py-2.5 rounded-xl bg-neon-pink text-white font-bold text-sm hover:bg-neon-pink/90 transition-all"
              >
                Заблокировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}