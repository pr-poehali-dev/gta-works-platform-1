import { useState } from "react";
import { User, UserRole } from "@/App";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";

interface Props {
  onLogin: (user: User, token?: string) => void;
}

type AuthMode = "login" | "register" | "verify";

export default function AuthPage({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("seeker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingRole, setPendingRole] = useState<UserRole>("seeker");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.auth.register({ name, email, password, role });
      setPendingUserId(data.user_id);
      setPendingName(name);
      setPendingRole(role);
      setMode("verify");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      onLogin({ ...data.user, id: String(data.user.id) }, data.token);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pendingUserId) return;
    setLoading(true);
    try {
      const data = await api.auth.verify({ user_id: pendingUserId, code });
      onLogin({ ...data.user, id: String(data.user.id) }, data.token);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  // Fallback demo login when backend not yet connected
  const demoLogin = () => {
    onLogin({ id: "demo", name: "Алексей Воронов", email: "demo@gtaworks.ru", role: "seeker", verified: true });
  };
  const demoAdminLogin = () => {
    onLogin({ id: "admin", name: "Администратор", email: "admin@gtaworks.ru", role: "admin", verified: true });
  };

  return (
    <div className="min-h-screen bg-background grid-bg hero-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-float delay-300" />
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-neon-pink/5 rounded-full blur-2xl" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-green flex items-center justify-center glow-green">
              <span className="font-unbounded font-black text-background text-lg">GW</span>
            </div>
          </div>
          <h1 className="font-unbounded font-black text-3xl text-foreground mb-1">
            GTA <span className="text-neon-green text-glow-green">Works</span>
          </h1>
          <p className="text-muted-foreground text-sm">Платформа занятости нового поколения</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/3 rounded-full blur-2xl" />

          {/* Verify mode */}
          {mode === "verify" && (
            <form onSubmit={handleVerify} className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Mail" size={28} className="text-neon-green" />
                </div>
                <h2 className="font-unbounded font-bold text-xl text-foreground mb-2">Подтвердите email</h2>
                <p className="text-muted-foreground text-sm">
                  Код отправлен на <span className="text-foreground font-medium">{pendingUser?.email}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Код подтверждения</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-neon-green transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-green text-background font-unbounded font-bold py-3 rounded-xl hover:bg-neon-green/90 transition-all duration-200 glow-green disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : null}
                  Подтвердить
                </button>
                <button type="button" className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors">
                  Отправить код повторно
                </button>
              </div>
            </form>
          )}

          {/* Login mode */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <h2 className="font-unbounded font-bold text-xl text-foreground mb-6">Войти в систему</h2>
              {error && <div className="mb-4 px-4 py-3 rounded-xl bg-neon-pink/10 border border-neon-pink/25 text-neon-pink text-sm">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                  <div className="relative">
                    <Icon name="Mail" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-muted border border-border rounded-xl pl-10 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-green text-background font-unbounded font-bold py-3 rounded-xl hover:bg-neon-green/90 transition-all duration-200 glow-green disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : null}
                  Войти
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Нет аккаунта?{" "}
                <button type="button" onClick={() => setMode("register")} className="text-neon-green hover:underline font-medium">
                  Зарегистрироваться
                </button>
              </p>
            </form>
          )}

          {/* Register mode */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="animate-fade-in">
              <h2 className="font-unbounded font-bold text-xl text-foreground mb-6">Создать аккаунт</h2>
              {error && <div className="mb-4 px-4 py-3 rounded-xl bg-neon-pink/10 border border-neon-pink/25 text-neon-pink text-sm">{error}</div>}
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["seeker", "employer"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                      ${role === r
                        ? "border-neon-green bg-neon-green/10 text-neon-green"
                        : "border-border bg-muted text-muted-foreground hover:border-border/80"
                      }
                    `}
                  >
                    <Icon name={r === "seeker" ? "User" : "Building2"} size={22} />
                    <span className="text-xs font-semibold">{r === "seeker" ? "Соискатель" : "Работодатель"}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Имя</label>
                  <div className="relative">
                    <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                  <div className="relative">
                    <Icon name="Mail" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="w-full bg-muted border border-border rounded-xl pl-10 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-green text-background font-unbounded font-bold py-3 rounded-xl hover:bg-neon-green/90 transition-all duration-200 glow-green disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : null}
                  Зарегистрироваться
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Уже есть аккаунт?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-neon-green hover:underline font-medium">
                  Войти
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Ticker + demo buttons */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Уже <span className="text-neon-green font-bold">12 847</span> специалистов нашли работу через GTA Works
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={demoLogin}
              className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-all hover:border-neon-green/30"
            >
              Демо: Соискатель
            </button>
            <button
              onClick={demoAdminLogin}
              className="text-[11px] text-muted-foreground hover:text-neon-pink border border-border rounded-lg px-3 py-1.5 transition-all hover:border-neon-pink/30"
            >
              Демо: Админ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}