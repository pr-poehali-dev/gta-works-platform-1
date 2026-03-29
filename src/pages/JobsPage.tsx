import { useState } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface Props { user: User; }

const allJobs = [
  { id: 1, title: "React-разработчик", company: "TechCore", city: "Москва", salary: [180000, 250000], exp: 3, skills: ["React", "TypeScript", "Redux", "GraphQL"], spec: "Frontend", hot: true, remote: true, desc: "Ищем опытного React-разработчика для работы над высоконагруженными приложениями." },
  { id: 2, title: "Python Backend Engineer", company: "DataStream", city: "Санкт-Петербург", salary: [200000, 300000], exp: 4, skills: ["Python", "FastAPI", "PostgreSQL", "Docker"], spec: "Backend", hot: true, remote: true, desc: "Разработка API-сервисов для аналитической платформы." },
  { id: 3, title: "UI/UX Дизайнер", company: "PixelStudio", city: "Москва", salary: [120000, 180000], exp: 2, skills: ["Figma", "Prototyping", "UX Research"], spec: "Design", hot: false, remote: false, desc: "Проектирование интерфейсов мобильных и веб-приложений." },
  { id: 4, title: "DevOps-инженер", company: "CloudForce", city: "Удалённо", salary: [220000, 320000], exp: 5, skills: ["Docker", "Kubernetes", "CI/CD", "Terraform"], spec: "DevOps", hot: false, remote: true, desc: "Поддержка и развитие облачной инфраструктуры компании." },
  { id: 5, title: "iOS разработчик", company: "AppWave", city: "Новосибирск", salary: [160000, 230000], exp: 3, skills: ["Swift", "SwiftUI", "CoreData"], spec: "Mobile", hot: false, remote: false, desc: "Разработка нового iOS-приложения для финтех-сектора." },
  { id: 6, title: "Data Scientist", company: "NeuroLab", city: "Москва", salary: [250000, 400000], exp: 4, skills: ["Python", "ML", "TensorFlow", "Pandas"], spec: "Data", hot: true, remote: true, desc: "Построение ML-моделей для прогнозирования пользовательского поведения." },
  { id: 7, title: "Project Manager", company: "AgileWorks", city: "Казань", salary: [130000, 190000], exp: 3, skills: ["Agile", "Scrum", "Jira"], spec: "Management", hot: false, remote: false, desc: "Управление несколькими командами разработки одновременно." },
  { id: 8, title: "Fullstack Developer", company: "StartupHub", city: "Екатеринбург", salary: [170000, 260000], exp: 4, skills: ["Node.js", "React", "MongoDB", "AWS"], spec: "Fullstack", hot: false, remote: true, desc: "Полный стек разработки для SaaS-платформы." },
];

const specs = ["Все", "Frontend", "Backend", "Design", "DevOps", "Mobile", "Data", "Management", "Fullstack"];
const expOptions = ["Любой", "До 1 года", "1–3 года", "3–5 лет", "5+ лет"];

export default function JobsPage({ user }: Props) {
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("Все");
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(500000);
  const [expFilter, setExpFilter] = useState("Любой");
  const [remote, setRemote] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = allJobs.filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (spec !== "Все" && j.spec !== spec) return false;
    if (j.salary[0] < salaryMin || j.salary[1] > salaryMax) return false;
    if (remote && !j.remote) return false;
    if (expFilter === "До 1 года" && j.exp >= 1) return false;
    if (expFilter === "1–3 года" && (j.exp < 1 || j.exp > 3)) return false;
    if (expFilter === "3–5 лет" && (j.exp < 3 || j.exp > 5)) return false;
    if (expFilter === "5+ лет" && j.exp < 5) return false;
    return true;
  });

  const toggleSave = (id: number) =>
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-unbounded font-black text-2xl text-foreground">Каталог вакансий</h1>
          <p className="text-muted-foreground text-sm mt-1">Найдено: <span className="text-neon-green font-bold">{filtered.length}</span> вакансий</p>
        </div>
        {user.role === "employer" && (
          <button className="flex items-center gap-2 bg-neon-green text-background font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-neon-green/90 glow-green transition-all">
            <Icon name="Plus" size={16} /> Разместить вакансию
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Должность, компания или навык..."
          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
        />
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${filtersOpen ? "bg-neon-green/15 border-neon-green/30 text-neon-green" : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Icon name="SlidersHorizontal" size={14} /> Фильтры
        </button>
      </div>

      {/* Spec tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {specs.map((s) => (
          <button
            key={s}
            onClick={() => setSpec(s)}
            className={`text-xs px-4 py-2 rounded-full border font-medium transition-all duration-200 ${
              spec === s
                ? "bg-neon-green text-background border-neon-green font-bold"
                : "bg-muted border-border text-muted-foreground hover:border-neon-green/30 hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Зарплата от (₽)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-green transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Зарплата до (₽)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-green transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Опыт работы</label>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-neon-green transition-colors"
            >
              {expOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRemote(!remote)}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative ${remote ? "bg-neon-green" : "bg-muted border border-border"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${remote ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-muted-foreground">Только удалённо</span>
          </div>
        </div>
      )}

      {/* Jobs list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-unbounded font-bold">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        )}
        {filtered.map((job, i) => (
          <div
            key={job.id}
            className="bg-card border border-border rounded-2xl p-5 card-hover animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-2xl">
                {job.spec === "Frontend" ? "⚛️" : job.spec === "Backend" ? "🐍" : job.spec === "Design" ? "🎨" : job.spec === "DevOps" ? "🐳" : job.spec === "Mobile" ? "📱" : job.spec === "Data" ? "🧠" : "💼"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      {job.hot && <span className="text-[10px] bg-neon-pink/15 text-neon-pink border border-neon-pink/25 px-2 py-0.5 rounded-full font-bold">🔥 HOT</span>}
                      {job.remote && <span className="text-[10px] bg-neon-blue/10 text-neon-blue border border-neon-blue/20 px-2 py-0.5 rounded-full">Удалённо</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{job.company} · {job.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-neon-green text-sm">{job.salary[0].toLocaleString()} – {job.salary[1].toLocaleString()} ₽</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Опыт: {job.exp}+ лет</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{job.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {job.skills.slice(0, 3).map((s) => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                    {job.skills.length > 3 && <span className="skill-tag">+{job.skills.length - 3}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSave(job.id)}
                      className={`p-2 rounded-lg transition-all ${saved.includes(job.id) ? "text-neon-pink bg-neon-pink/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                      <Icon name={saved.includes(job.id) ? "BookmarkCheck" : "Bookmark"} size={16} />
                    </button>
                    <button className="flex items-center gap-1.5 bg-neon-green/10 text-neon-green border border-neon-green/20 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-neon-green hover:text-background transition-all duration-200">
                      Откликнуться
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
