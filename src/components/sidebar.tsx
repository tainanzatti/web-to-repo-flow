import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Layers, PenTool, MessageSquare, Trophy, BarChart3, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "../lib/auth-context";

const NAV_ITEMS = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/nucleo", label: "Núcleo", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/questoes", label: "Questões", icon: PenTool },
  { to: "/redacao", label: "Redação", icon: PenTool },
  { to: "/chat", label: "Chat IA", icon: MessageSquare },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/desempenho", label: "Desempenho", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  return (
    <aside className="w-16 lg:w-64 shrink-0 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800 flex flex-col sticky top-0 h-screen">
      <div className="p-4 flex items-center gap-3 border-b border-ink-100 dark:border-ink-800">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0"><Shield className="w-5 h-5" /></div>
        <span className="font-bold text-ink-900 dark:text-ink-100 hidden lg:block">PMSC Prep</span>
      </div>
      <nav className="flex-1 p-2 lg:p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"}`}>
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-2 lg:p-3 border-t border-ink-100 dark:border-ink-800">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors w-full">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
