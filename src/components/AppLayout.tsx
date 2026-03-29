import { useState } from "react";
import { User, Page } from "@/App";
import Icon from "@/components/ui/icon";

interface Props {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "jobs", label: "Вакансии", icon: "Briefcase" },
  { id: "resume", label: "Резюме", icon: "FileText" },
  { id: "chat", label: "Чат", icon: "MessageCircle" },
  { id: "saved", label: "Сохранённые", icon: "Bookmark" },
  { id: "profile", label: "Профиль", icon: "User" },
];

export default function AppLayout({ user, currentPage, onNavigate, onLogout, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-bg flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neon-green flex items-center justify-center glow-green">
              <span className="font-unbounded font-black text-background text-sm">GW</span>
            </div>
            <div>
              <p className="font-unbounded font-bold text-foreground text-sm">GTA Works</p>
              <p className="text-xs text-muted-foreground">Платформа занятости</p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-muted border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-purple flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-background">{user.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === "employer" ? "Работодатель" : "Соискатель"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${active
                    ? "bg-neon-green text-background font-semibold glow-green"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
                {item.id === "chat" && (
                  <span className="ml-auto bg-neon-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-neon-pink hover:bg-muted transition-all duration-200"
          >
            <Icon name="LogOut" size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Icon name="Menu" size={22} />
          </button>
          <span className="font-unbounded font-bold text-sm text-neon-green text-glow-green">GTA Works</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-purple flex items-center justify-center">
            <span className="text-xs font-bold text-background">{user.name.charAt(0)}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
