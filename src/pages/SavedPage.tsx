import { useState } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface Props { user: User; }

const savedJobs = [
  { id: 1, title: "React-разработчик", company: "TechCore", salary: "180 000 – 250 000 ₽", tags: ["React", "TypeScript"], date: "28 марта", hot: true },
  { id: 2, title: "Python Backend Engineer", company: "DataStream", salary: "200 000 – 300 000 ₽", tags: ["Python", "FastAPI"], date: "27 марта", hot: true },
  { id: 3, title: "Data Scientist", company: "NeuroLab", salary: "250 000 – 400 000 ₽", tags: ["ML", "TensorFlow"], date: "25 марта", hot: false },
];

const savedCandidates = [
  { id: 1, name: "Артём Козлов", role: "Frontend Developer", salary: "от 200 000 ₽", skills: ["React", "TypeScript"], date: "28 марта", available: true },
  { id: 2, name: "Анна Волкова", role: "Data Scientist", salary: "от 240 000 ₽", skills: ["Python", "ML"], date: "26 марта", available: true },
];

export default function SavedPage({ user }: Props) {
  const [tab, setTab] = useState<"jobs" | "candidates">("jobs");
  const [jobs, setJobs] = useState(savedJobs);
  const [candidates, setCandidates] = useState(savedCandidates);

  const removeJob = (id: number) => setJobs((j) => j.filter((x) => x.id !== id));
  const removeCandidate = (id: number) => setCandidates((c) => c.filter((x) => x.id !== id));

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-unbounded font-black text-2xl text-foreground">Сохранённые</h1>
        <p className="text-muted-foreground text-sm mt-1">Ваши избранные вакансии и кандидаты</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-card border border-border p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("jobs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "jobs" ? "bg-neon-green text-background font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon name="Briefcase" size={15} />
          Вакансии
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === "jobs" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}`}>{jobs.length}</span>
        </button>
        <button
          onClick={() => setTab("candidates")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "candidates" ? "bg-neon-purple text-white font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon name="Users" size={15} />
          Кандидаты
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === "candidates" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>{candidates.length}</span>
        </button>
      </div>

      {/* Jobs */}
      {tab === "jobs" && (
        <div className="space-y-3">
          {jobs.length === 0 && (
            <div className="text-center py-20">
              <Icon name="BookmarkX" size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="font-unbounded font-bold text-muted-foreground">Нет сохранённых вакансий</p>
              <p className="text-sm text-muted-foreground mt-1">Добавляйте понравившиеся вакансии в закладки</p>
            </div>
          )}
          {jobs.map((j, i) => (
            <div key={j.id} className="bg-card border border-border rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                    <Icon name="Building2" size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{j.title}</h3>
                      {j.hot && <span className="text-[10px] bg-neon-pink/15 text-neon-pink border border-neon-pink/25 px-2 py-0.5 rounded-full font-bold">🔥</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{j.company}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {j.tags.map((t) => <span key={t} className="skill-tag">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-green">{j.salary}</p>
                  <p className="text-xs text-muted-foreground mt-1">Сохранено {j.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => removeJob(j.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-pink transition-colors px-3 py-1.5 rounded-lg hover:bg-neon-pink/5"
                >
                  <Icon name="Trash2" size={13} /> Удалить
                </button>
                <button className="flex items-center gap-1.5 text-xs bg-neon-green/10 text-neon-green border border-neon-green/20 px-4 py-1.5 rounded-lg hover:bg-neon-green hover:text-background transition-all duration-200 font-medium">
                  <Icon name="ExternalLink" size={13} /> Откликнуться
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidates */}
      {tab === "candidates" && (
        <div className="space-y-3">
          {candidates.length === 0 && (
            <div className="text-center py-20">
              <Icon name="BookmarkX" size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="font-unbounded font-bold text-muted-foreground">Нет сохранённых кандидатов</p>
              <p className="text-sm text-muted-foreground mt-1">Добавляйте интересных кандидатов из хранилища резюме</p>
            </div>
          )}
          {candidates.map((c, i) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-pink/20 flex items-center justify-center text-lg font-bold text-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{c.name}</h3>
                      {c.available
                        ? <span className="text-[10px] bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full">Открыт</span>
                        : <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">Занят</span>
                      }
                    </div>
                    <p className="text-sm text-neon-purple mt-0.5">{c.role}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {c.skills.map((s) => <span key={s} className="text-[10px] bg-neon-purple/8 text-neon-purple border border-neon-purple/20 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-green">{c.salary}</p>
                  <p className="text-xs text-muted-foreground mt-1">Сохранено {c.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => removeCandidate(c.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-neon-pink transition-colors px-3 py-1.5 rounded-lg hover:bg-neon-pink/5"
                >
                  <Icon name="Trash2" size={13} /> Удалить
                </button>
                <button className="flex items-center gap-1.5 text-xs bg-neon-purple/10 text-neon-purple border border-neon-purple/20 px-4 py-1.5 rounded-lg hover:bg-neon-purple hover:text-white transition-all duration-200 font-medium">
                  <Icon name="MessageCircle" size={13} /> Написать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
