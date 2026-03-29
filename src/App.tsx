import { useState } from "react";
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
import AppLayout from "./components/AppLayout";

export type Page = "home" | "profile" | "jobs" | "resume" | "chat" | "saved";
export type UserRole = "employer" | "seeker";

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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage("home");
  };

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
      </AppLayout>
    </TooltipProvider>
  );
}
