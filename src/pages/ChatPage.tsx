import { useState, useRef, useEffect } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface Props { user: User; }

const contacts = [
  { id: 1, name: "TechCore HR", role: "Работодатель", avatar: "T", lastMsg: "Мы рады пригласить вас на интервью!", time: "14:30", unread: 2, online: true },
  { id: 2, name: "Артём Козлов", role: "Соискатель", avatar: "А", lastMsg: "Спасибо за ответ, буду ждать!", time: "12:15", unread: 0, online: false },
  { id: 3, name: "PixelStudio", role: "Работодатель", avatar: "P", lastMsg: "Пришлите, пожалуйста, портфолио", time: "Вчера", unread: 1, online: true },
  { id: 4, name: "Мария Смирнова", role: "Соискатель", avatar: "М", lastMsg: "Готова приступить с 1 мая", time: "Вчера", unread: 0, online: false },
  { id: 5, name: "DataStream", role: "Работодатель", avatar: "D", lastMsg: "Позиция уже закрыта, извините", time: "Пн", unread: 0, online: false },
];

const mockMessages: Record<number, { id: number; text: string; sent: boolean; time: string }[]> = {
  1: [
    { id: 1, text: "Добрый день! Мы увидели ваше резюме и хотели бы пригласить вас на собеседование.", sent: false, time: "14:20" },
    { id: 2, text: "Здравствуйте! Спасибо за интерес. Когда можно провести встречу?", sent: true, time: "14:25" },
    { id: 3, text: "Мы рады пригласить вас на интервью! Как насчёт среды в 15:00?", sent: false, time: "14:30" },
  ],
  2: [
    { id: 1, text: "Здравствуйте! Мы рассмотрели ваше резюме, всё выглядит отлично!", sent: true, time: "12:00" },
    { id: 2, text: "Спасибо за ответ, буду ждать!", sent: false, time: "12:15" },
  ],
  3: [
    { id: 1, text: "Добрый день! Пришлите, пожалуйста, портфолио", sent: false, time: "Вчера" },
  ],
  4: [{ id: 1, text: "Готова приступить с 1 мая", sent: false, time: "Вчера" }],
  5: [{ id: 1, text: "Позиция уже закрыта, извините", sent: false, time: "Пн" }],
};

export default function ChatPage({ user }: Props) {
  const [active, setActive] = useState<number>(1);
  const [messages, setMessages] = useState(mockMessages);
  const [text, setText] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active, messages]);

  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const newMsg = { id: Date.now(), text: text.trim(), sent: true, time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => ({ ...prev, [active]: [...(prev[active] || []), newMsg] }));
    setText("");
  };

  const activeContact = contacts.find((c) => c.id === active)!;
  const msgs = messages[active] || [];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] animate-fade-in">
      <h1 className="font-unbounded font-black text-2xl text-foreground mb-4">Чат</h1>
      <div className="bg-card border border-border rounded-2xl overflow-hidden h-[calc(100%-4rem)] flex">
        {/* Contacts list */}
        <div className={`w-full md:w-72 border-r border-border flex flex-col flex-shrink-0 ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Поиск..."
                className="w-full bg-muted border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActive(c.id); setMobileView("chat"); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/50 transition-all ${active === c.id ? "bg-neon-green/8" : "hover:bg-muted"}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/40 to-neon-blue/20 flex items-center justify-center text-sm font-bold text-foreground">
                    {c.avatar}
                  </div>
                  {c.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neon-green rounded-full border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                    {c.unread > 0 && (
                      <span className="ml-1 bg-neon-green text-background text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <button onClick={() => setMobileView("list")} className="md:hidden text-muted-foreground mr-1">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple/40 to-neon-blue/20 flex items-center justify-center text-sm font-bold text-foreground">
                {activeContact.avatar}
              </div>
              {activeContact.online && <div className="absolute bottom-0 right-0 w-2 h-2 bg-neon-green rounded-full border-2 border-card" />}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{activeContact.name}</p>
              <p className="text-xs text-muted-foreground">{activeContact.online ? "В сети" : "Не в сети"} · {activeContact.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Icon name="Phone" size={16} />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <Icon name="MoreVertical" size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sent ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${m.sent ? "msg-sent rounded-br-sm" : "msg-recv rounded-bl-sm"}`}>
                  <p className="text-sm text-foreground">{m.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMsg} className="px-4 py-4 border-t border-border flex items-center gap-3">
            <button type="button" className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <Icon name="Paperclip" size={18} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green transition-colors"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="bg-neon-green text-background p-2.5 rounded-xl hover:bg-neon-green/90 transition-all disabled:opacity-40 flex-shrink-0 glow-green"
            >
              <Icon name="Send" size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
