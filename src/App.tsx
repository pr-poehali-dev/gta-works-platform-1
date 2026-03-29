import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import JobsPage from "./pages/JobsPage";
import ResumePage from "./pages/ResumePage";
import ChatPage from "./pages/ChatPage";
import SavedPage from "./pages/SavedPage";
import AdminPage from "./pages/AdminPage";
import AppLayout from "./components/AppLayout";
import { api } from "./lib/api";

export type Page = "home" | "profile" | "jobs" | "resume" | "chat" | "saved" | "admin";
export type UserRole = "employer" | "seeker" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  verified: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [authChecked, setAuthChecked] = useState(false);

  // Восстанавливаем сессию при загрузке
  useEffect(() => {
    const token = localStorage.getItem("gta_token");
    if (!token) { setAuthChecked(true); return; }
    api.auth.me()
      .then((data) => {
        setCurrentUser({ ...data.user, id: String(data.user.id) });
      })
      .catch(() => { localStorage.removeItem("gta_token"); })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogin = (user: User, token?: string) => {
    if (token) localStorage.setItem("gta_token", token);
    setCurrentUser(user);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    api.auth.logout().catch(() => null);
    localStorage.removeItem("gta_token");
    setCurrentUser(null);
    setCurrentPage("home");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-neon-green flex items-center justify-center mx-auto mb-4 glow-green">
            <span className="font-unbounded font-black text-background">GW</span>
          </div>
          <div className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthPage onLogin={handleLogin} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppLayout
        user={currentUser}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      >
        {currentPage === "home" && <HomePage user={currentUser} onNavigate={setCurrentPage} />}
        {currentPage === "profile" && <ProfilePage user={currentUser} />}
        {currentPage === "jobs" && <JobsPage user={currentUser} />}
        {currentPage === "resume" && <ResumePage user={currentUser} />}
        {currentPage === "chat" && <ChatPage user={currentUser} />}
        {currentPage === "saved" && <SavedPage user={currentUser} />}
        {currentPage === "admin" && currentUser.role === "admin" && <AdminPage user={currentUser} />}
      </AppLayout>
    </TooltipProvider>
  );
}
