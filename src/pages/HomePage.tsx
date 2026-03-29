import { User, Page } from "@/App";
import Icon from "@/components/ui/icon";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
}

const stats = [
  { label: "Активных вакансий", value: "4 218", icon: "Briefcase", color: "text-neon-green" },
  { label: "Резюме в базе", value: "18 940", icon: "FileText", color: "text-neon-purple" },
  { label: "Компаний", value: "1 302", icon: "Building2", color: "text-neon-pink" },
  { label: "Трудоустроено", value: "12 847", icon: "CheckCircle2", color: "text-neon-blue" },
];

const trending = [
  { title: "React-разработчик", company: "TechCore", salary: "180 000 – 250 000 ₽", tags: ["React", "TypeScript", "Redux"], hot: true },
  { title: "UI/UX Дизайнер", company: "PixelStudio", salary: "120 000 – 180 000 ₽", tags: ["Figma", "Prototyping"], hot: false },
  { title: "Python Backend", company: "DataStream", salary: "200 000 – 300 000 ₽", tags: ["Python", "FastAPI", "PostgreSQL"], hot: true },
  { title: "DevOps-инженер", company: "CloudForce", salary: "220 000 – 320 000 ₽", tags: ["Docker", "K8s", "CI/CD"], hot: false },
];

const actions = [
  { id: "jobs" as Page, icon: "Search", label: "Найти вакансию", desc: "Умный поиск с фильтрами", color: "from-neon-green/20 to-neon-green/5", border: "border-neon-green/20", iconColor: "text-neon-green" },
  { id: "resume" as Page, icon: "FileText", label: "Резюме", desc: "База кандидатов", color: "from-neon-purple/20 to-neon-purple/5", border: "border-neon-purple/20", iconColor: "text-neon-purple" },
  { id: "chat" as Page, icon: "MessageCircle", label: "Чат", desc: "Переписка с работодателем", color: "from-neon-blue/20 to-neon-blue/5", border: "border-neon-blue/20", iconColor: "text-neon-blue" },
  { id: "saved" as Page, icon: "Bookmark", label: "Сохранённые", desc: "Избранные вакансии", color: "from-neon-pink/20 to-neon-pink/5", border: "border-neon-pink/20", iconColor: "text-neon-pink" },
];

export default function HomePage({ user, onNavigate }: Props) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero greeting */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border p-8 hero-mesh">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="skill-tag">
              {user.role === "employer" ? "👔 Работодатель" : "🚀 Соискатель"}
            </span>
            {user.verified && (
              <span className="text-xs bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Icon name="ShieldCheck" size={12} /> Верифицирован
              </span>
            )}
          </div>
          <h1 className="font-unbounded font-black text-2xl md:text-3xl text-foreground mb-2">
            Привет, <span className="text-neon-green text-glow-green">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground max-w-lg">
            {user.role === "seeker"
              ? "Сегодня на платформе 4 218 открытых вакансий. Воспользуйся умной фильтрацией — найди идеальное место."
              : "Ваши вакансии активны. Сегодня 47 новых кандидатов откликнулось на ваши позиции."}
          </p>
          <button
            onClick={() => onNavigate(user.role === "seeker" ? "jobs" : "resume")}
            className="mt-5 inline-flex items-center gap-2 bg-neon-green text-background font-unbounded font-bold text-sm px-6 py-3 rounded-xl hover:bg-neon-green/90 transition-all duration-200 glow-green"
          >
            <Icon name={user.role === "seeker" ? "Search" : "Users"} size={16} />
            {user.role === "seeker" ? "Найти вакансию" : "Посмотреть кандидатов"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-5 card-hover"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Icon name={s.icon} size={20} className={`${s.color} mb-3`} />
            <p className={`font-unbounded font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-unbounded font-bold text-lg text-foreground mb-4">Быстрый доступ</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => onNavigate(a.id)}
              className={`bg-gradient-to-br ${a.color} border ${a.border} rounded-2xl p-5 text-left card-hover transition-all duration-200 group`}
            >
              <Icon name={a.icon} size={24} className={`${a.iconColor} mb-3 group-hover:scale-110 transition-transform`} />
              <p className="font-semibold text-foreground text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Trending jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-unbounded font-bold text-lg text-foreground">Горящие вакансии</h2>
          <button onClick={() => onNavigate("jobs")} className="text-sm text-neon-green hover:underline flex items-center gap-1">
            Все вакансии <Icon name="ArrowRight" size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {trending.map((job, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 card-hover flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon name="Building2" size={22} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{job.title}</p>
                  {job.hot && (
                    <span className="text-[10px] bg-neon-pink/15 text-neon-pink border border-neon-pink/25 px-2 py-0.5 rounded-full font-bold">🔥 HOT</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {job.tags.map((t) => (
                    <span key={t} className="skill-tag">{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-neon-green">{job.salary}</p>
                <button className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                  Откликнуться <Icon name="ArrowRight" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
