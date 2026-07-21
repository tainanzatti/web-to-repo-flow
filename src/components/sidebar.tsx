import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Shield, LayoutGrid, BookOpen, Layers, PenTool, BarChart3, User, ChevronLeft, ChevronRight, FileQuestion } from "lucide-react";

const NAV_ITEMS = [
  { to: "/painel", label: "Painel", icon: LayoutGrid },
  { to: "/nucleo", label: "Núcleo", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/questoes", label: "Questões", icon: FileQuestion },
  { to: "/redacao", label: "Redação", icon: PenTool },
  { to: "/desempenho", label: "Desempenho", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`${collapsed ? "w-16" : "w-60"} shrink-0 bg-white border-r border-ink-100 flex flex-col transition-all duration-300 h-screen sticky top-0`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-ink-100">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-ink-900 leading-tight">Operação</p>
            <p className="text-xs text-ink-500 leading-tight">PMSC 2026</p>
          </div>
        )}
      </div>
      <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
