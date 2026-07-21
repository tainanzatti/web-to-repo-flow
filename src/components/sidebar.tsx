import { useState, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  Layers,
  BarChart3,
  PenLine,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { fetchUserPrefs, updateUserPrefs } from "../lib/db";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/nucleo", label: "Núcleo", icon: Lock },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/questoes", label: "Questões", icon: ClipboardList },
  { to: "/desempenho", label: "Desempenho", icon: BarChart3 },
  { to: "/redacao", label: "Redação", icon: PenLine },
  { to: "/perfil", label: "Perfil", icon: User },
];

interface SidebarProps {
  flashcardsPendentes: number;
}

export default function Sidebar({ flashcardsPendentes }: SidebarProps) {
  const [expandida, setExpandida] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const prefs = await fetchUserPrefs();
        setExpandida(prefs.sidebar_expandida);
      } catch {
        const stored = localStorage.getItem("sidebar_expandida");
        if (stored !== null) setExpandida(stored === "true");
      }
      setLoaded(true);
    })();
  }, []);

  const toggle = async () => {
    const next = !expandida;
    setExpandida(next);
    localStorage.setItem("sidebar_expandida", String(next));
    try {
      await updateUserPrefs({ sidebar_expandida: next });
    } catch {
      // localStorage fallback already set
    }
  };

  if (!loaded) {
    return (
      <div
        className="w-64 shrink-0 bg-ink-950"
        style={{ minHeight: "100vh" }}
      />
    );
  }

  return (
    <aside
      className={`shrink-0 bg-ink-950 text-ink-100 flex flex-col transition-all duration-300 ease-in-out ${
        expandida ? "w-64" : "w-16"
      }`}
      style={{ minHeight: "100vh" }}
    >
      <button
        onClick={toggle}
        className={`flex items-center gap-3 px-4 py-4 text-ink-300 hover:text-white hover:bg-ink-900 transition-colors border-b border-ink-800 ${
          expandida ? "justify-start" : "justify-center"
        }`}
        title={expandida ? "Recolher" : "Expandir"}
      >
        {expandida ? (
          <>
            <PanelLeftClose className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">Operação PMSC</span>
          </>
        ) : (
          <PanelLeftOpen className="w-5 h-5 shrink-0" />
        )}
      </button>

      <nav className="flex-1 py-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-ink-300 hover:text-white hover:bg-ink-900"
                } ${expandida ? "justify-start" : "justify-center"}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {expandida && <span>{item.label}</span>}
              {!expandida && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-ink-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              )}
              {item.to === "/flashcards" && flashcardsPendentes > 0 && (
                <span
                  className={`bg-warning-500 text-ink-950 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${
                    expandida ? "ml-auto" : "absolute -top-1 -right-1"
                  }`}
                >
                  {flashcardsPendentes}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={`px-4 py-3 border-t border-ink-800 ${
          expandida ? "text-left" : "text-center"
        }`}
      >
        {expandida ? (
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Soldado PMSC 2026</span>
          </div>
        ) : (
          <Sparkles className="w-3.5 h-3.5 mx-auto text-ink-400" />
        )}
      </div>
    </aside>
  );
}
