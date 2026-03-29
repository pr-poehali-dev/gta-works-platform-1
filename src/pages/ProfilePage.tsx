import { useState } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface Props { user: User; }

const experienceData = [
  { company: "DigitalAgency", role: "Frontend Developer", period: "2022 – наст. время", desc: "Разработка React-приложений, оптимизация производительности, работа с GraphQL." },
  { company: "StartupX", role: "Junior Developer", period: "2020 – 2022", desc: "Поддержка веб-сервисов на Vue.js и Node.js, работа в Agile-команде." },
];

const skillsData = ["React", "TypeScript", "Next.js", "GraphQL", "Node.js", "Docker", "PostgreSQL", "Figma"];

export default function ProfilePage({ user }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState("Frontend Developer");
  const [city, setCity] = useState("Москва");
  const [salary, setSalary] = useState("180 000 – 250 000");
  const [bio, setBio] = useState("Опытный frontend-разработчик с 4 годами коммерческого опыта. Специализируюсь на React-экосистеме и современных инструментах разработки.");
  const [skills] = useState(skillsData);

  const stats = [
    { label: "Просмотров профиля", value: "1 284", icon: "Eye", color: "text-neon-green" },
    { label: "Откликов", value: "23", icon: "Send", color: "text-neon-purple" },
    { label: "Приглашений", value: "8", icon: "Mail", color: "text-neon-pink" },
    { label: "Сохранено работодателями", value: "47", icon: "Bookmark", color: "text-neon-blue" },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-neon-green/20 via-neon-purple/15 to-neon-pink/10 relative">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                editMode ? "bg-neon-green text-background" : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <Icon name={editMode ? "Check" : "Pencil"} size={13} />
              {editMode ? "Сохранить" : "Редактировать"}
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green to-neon-purple flex items-center justify-center text-3xl font-black text-background border-4 border-card flex-shrink-0 glow-green">
              {user.name.charAt(0)}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2">
                {editMode ? (
                  <input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border border-neon-green/30 rounded-lg px-3 py-1 text-lg font-bold text-foreground focus:outline-none" />
                ) : (
                  <h2 className="font-unbounded font-bold text-xl text-foreground">{name}</h2>
                )}
                {user.verified && (
                  <span className="text-xs bg-neon-green/10 text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon name="ShieldCheck" size={11} /> Верифицирован
                  </span>
                )}
              </div>
              {editMode ? (
                <input value={position} onChange={(e) => setPosition(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-1 text-sm text-muted-foreground focus:outline-none mt-1 w-64" />
              ) : (
                <p className="text-neon-green text-sm mt-0.5">{position}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Icon name="MapPin" size={14} />
              {editMode ? (
                <input value={city} onChange={(e) => setCity(e.target.value)} className="bg-muted border border-border rounded px-2 py-0.5 text-sm focus:outline-none w-32" />
              ) : city}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="DollarSign" size={14} />
              {editMode ? (
                <input value={salary} onChange={(e) => setSalary(e.target.value)} className="bg-muted border border-border rounded px-2 py-0.5 text-sm focus:outline-none w-44" />
              ) : `${salary} ₽/мес`}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Mail" size={14} />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="User" size={14} />
              {user.role === "employer" ? "Работодатель" : "Соискатель"}
            </span>
          </div>

          {editMode ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neon-green resize-none transition-colors"
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center card-hover">
            <Icon name={s.icon} size={18} className={`${s.color} mx-auto mb-2`} />
            <p className={`font-unbounded font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-unbounded font-bold text-base text-foreground mb-4 flex items-center gap-2">
          <Icon name="Zap" size={18} className="text-neon-green" />
          Навыки
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="skill-tag text-sm py-1 px-3">{s}</span>
          ))}
          {editMode && (
            <button className="skill-tag text-sm py-1 px-3 opacity-50 hover:opacity-100 border-dashed">+ Добавить</button>
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-unbounded font-bold text-base text-foreground mb-4 flex items-center gap-2">
          <Icon name="Briefcase" size={18} className="text-neon-purple" />
          Опыт работы
        </h3>
        <div className="space-y-4">
          {experienceData.map((exp, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-neon-purple mt-1.5 flex-shrink-0" />
                {i < experienceData.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{exp.role}</p>
                  <span className="text-[10px] bg-neon-purple/10 text-neon-purple border border-neon-purple/20 px-2 py-0.5 rounded-full">{exp.company}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{exp.period}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{exp.desc}</p>
              </div>
            </div>
          ))}
          {editMode && (
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-purple transition-colors border border-dashed border-border rounded-xl px-4 py-3 w-full">
              <Icon name="Plus" size={15} /> Добавить место работы
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
