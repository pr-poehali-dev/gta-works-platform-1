import { useState } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface Props { user: User; }

const resumes = [
  { id: 1, name: "Артём Козлов", role: "Frontend Developer", exp: 4, city: "Москва", salary: 200000, skills: ["React", "TypeScript", "Next.js", "GraphQL"], bio: "Опытный frontend-разработчик с акцентом на производительность и UX. Участвовал в 20+ коммерческих проектах.", available: true, remote: true },
  { id: 2, name: "Мария Смирнова", role: "UI/UX Designer", exp: 3, city: "Санкт-Петербург", salary: 150000, skills: ["Figma", "Adobe XD", "UX Research", "Prototyping"], bio: "Дизайнер с глубоким пониманием пользовательского опыта. Создаю интерфейсы, которыми приятно пользоваться.", available: true, remote: false },
  { id: 3, name: "Иван Петров", role: "Python Backend Engineer", exp: 5, city: "Удалённо", salary: 280000, skills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"], bio: "Backend-разработчик с опытом построения высоконагруженных систем и микросервисной архитектуры.", available: false, remote: true },
  { id: 4, name: "Анна Волкова", role: "Data Scientist", exp: 3, city: "Новосибирск", salary: 240000, skills: ["Python", "ML", "TensorFlow", "SQL", "Tableau"], bio: "Специалист по данным с опытом построения прогнозных моделей в e-commerce и fintech.", available: true, remote: true },
  { id: 5, name: "Дмитрий Лебедев", role: "DevOps Engineer", exp: 6, city: "Москва", salary: 320000, skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Prometheus"], bio: "DevOps с опытом автоматизации инфраструктуры для крупных enterprise-проектов.", available: true, remote: true },
  { id: 6, name: "Ольга Никитина", role: "iOS Developer", exp: 4, city: "Казань", salary: 200000, skills: ["Swift", "SwiftUI", "Combine", "CoreData"], bio: "iOS-разработчик с опытом публикации 8 приложений в App Store с суммарными 500k+ загрузками.", available: true, remote: false },
];

export default function ResumePage({ user }: Props) {
  const [search, setSearch] = useState("");
  const [salaryMax, setSalaryMax] = useState(500000);
  const [availOnly, setAvailOnly] = useState(false);
  const [selected, setSelected] = useState<typeof resumes[0] | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<number[]>([]);

  const filtered = resumes.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.role.toLowerCase().includes(search.toLowerCase())) return false;
    if (r.salary > salaryMax) return false;
    if (availOnly && !r.available) return false;
    return true;
  });

  const toggleSave = (id: number) =>
    setSavedCandidates((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-unbounded font-black text-2xl text-foreground">Хранилище резюме</h1>
          <p className="text-muted-foreground text-sm mt-1">
            <span className="text-neon-purple font-bold">{filtered.length}</span> кандидатов доступно
          </p>
        </div>
        {user.role === "seeker" && (
          <button className="flex items-center gap-2 bg-neon-purple text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-neon-purple/90 glow-purple transition-all">
            <Icon name="Plus" size={16} /> Разместить резюме
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя, специальность или навык..."
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple transition-colors"
          />
        </div>
        <div>
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(Number(e.target.value))}
            placeholder="Ожидание до..."
            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-purple transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAvailOnly(!availOnly)}
            className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${availOnly ? "bg-neon-purple" : "bg-muted border border-border"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${availOnly ? "left-5" : "left-0.5"}`} />
          </button>
          <span className="text-sm text-muted-foreground">Только доступные</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => (
          <div
            key={r.id}
            className="bg-card border border-border rounded-2xl p-5 card-hover cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={() => setSelected(r)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 flex items-center justify-center text-lg font-bold text-foreground">
                {r.name.charAt(0)}
              </div>
              <div className="flex items-center gap-2">
                {r.available
                  ? <span className="text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full">● Открыт</span>
                  : <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">● Занят</span>
                }
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(r.id); }}
                  className={`p-1.5 rounded-lg transition-all ${savedCandidates.includes(r.id) ? "text-neon-pink bg-neon-pink/10" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon name={savedCandidates.includes(r.id) ? "BookmarkCheck" : "Bookmark"} size={14} />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-foreground">{r.name}</h3>
            <p className="text-sm text-neon-purple mt-0.5">{r.role}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.city} · {r.exp} лет опыта</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{r.bio}</p>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {r.skills.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] bg-neon-purple/8 text-neon-purple border border-neon-purple/20 px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {r.skills.length > 3 && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">+{r.skills.length - 3}</span>}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">от {r.salary.toLocaleString()} ₽</p>
              {r.remote && <span className="text-[10px] text-neon-blue">🌐 Удалённо</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 flex items-center justify-center text-2xl font-bold text-foreground">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-unbounded font-bold text-lg text-foreground">{selected.name}</h3>
                  <p className="text-neon-purple text-sm">{selected.role}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.city} · {selected.exp} лет</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{selected.bio}</p>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {selected.skills.map((s) => (
                <span key={s} className="text-xs bg-neon-purple/8 text-neon-purple border border-neon-purple/20 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Ожидаемая зарплата</p>
                <p className="font-bold text-neon-green">от {selected.salary.toLocaleString()} ₽</p>
              </div>
              <button className="flex items-center gap-2 bg-neon-purple text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-neon-purple/90 transition-all glow-purple">
                <Icon name="MessageCircle" size={16} /> Написать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
