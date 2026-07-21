import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import {
  startStudySession, endStudySession, fetchActiveSession,
  addDailyTime, fetchStudyTimeStats, type StudyTimeStats,
} from "./db";

type TimerStatus = "idle" | "running" | "paused";

interface TimerContextValue {
  status: TimerStatus;
  elapsedSeconds: number;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  studyStats: StudyTimeStats | null;
  refreshStats: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

const STORAGE_KEY = "pmsc-timer-state";

interface StoredTimerState {
  status: TimerStatus;
  elapsedSeconds: number;
  sessionId: string | null;
  lastTick: number | null;
}

function loadStoredState(): StoredTimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "idle", elapsedSeconds: 0, sessionId: null, lastTick: null };
    return JSON.parse(raw) as StoredTimerState;
  } catch {
    return { status: "idle", elapsedSeconds: 0, sessionId: null, lastTick: null };
  }
}

function saveStoredState(state: StoredTimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [studyStats, setStudyStats] = useState<StudyTimeStats | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore state on mount / user change
  useEffect(() => {
    if (!user) {
      setStatus("idle");
      setElapsedSeconds(0);
      sessionIdRef.current = null;
      setStudyStats(null);
      return;
    }

    const stored = loadStoredState();

    // Try to restore active session from DB
    fetchActiveSession()
      .then((session) => {
        if (session) {
          sessionIdRef.current = session.id;
          const inicio = new Date(session.inicio).getTime();
          const now = Date.now();
          const dbElapsed = Math.floor((now - inicio) / 1000);

          if (stored.status === "paused" && stored.sessionId === session.id) {
            setStatus("paused");
            setElapsedSeconds(stored.elapsedSeconds);
          } else {
            setStatus("running");
            setElapsedSeconds(dbElapsed);
          }
        } else if (stored.status !== "idle" && stored.sessionId) {
          // No active session in DB — clear stale local state
          setStatus("idle");
          setElapsedSeconds(0);
          sessionIdRef.current = null;
          saveStoredState({ status: "idle", elapsedSeconds: 0, sessionId: null, lastTick: null });
        }
      })
      .catch(() => {});

    refreshStats();
  }, [user]);

  // Tick interval
  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          saveStoredState({
            status: "running",
            elapsedSeconds: next,
            sessionId: sessionIdRef.current,
            lastTick: Date.now(),
          });
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  // Persist to daily time every 60 seconds while running
  useEffect(() => {
    if (status !== "running") return;
    const flushInterval = setInterval(async () => {
      try {
        await addDailyTime(60);
        await refreshStats();
      } catch {}
    }, 60000);
    return () => clearInterval(flushInterval);
  }, [status]);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await fetchStudyTimeStats();
      setStudyStats(stats);
    } catch {}
  }, []);

  const start = useCallback(async () => {
    if (status === "running") return;
    if (!sessionIdRef.current) {
      try {
        const session = await startStudySession();
        sessionIdRef.current = session?.id ?? null;
      } catch {}
    }
    setStatus("running");
    saveStoredState({
      status: "running",
      elapsedSeconds,
      sessionId: sessionIdRef.current,
      lastTick: Date.now(),
    });
  }, [status, elapsedSeconds]);

  const pause = useCallback(async () => {
    setStatus("paused");
    saveStoredState({
      status: "paused",
      elapsedSeconds,
      sessionId: sessionIdRef.current,
      lastTick: null,
    });
  }, [elapsedSeconds]);

  const reset = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await endStudySession(sessionIdRef.current, elapsedSeconds);
        await addDailyTime(elapsedSeconds);
        await refreshStats();
      } catch {}
    }
    sessionIdRef.current = null;
    setStatus("idle");
    setElapsedSeconds(0);
    saveStoredState({ status: "idle", elapsedSeconds: 0, sessionId: null, lastTick: null });
  }, [elapsedSeconds]);

  return (
    <TimerContext.Provider value={{ status, elapsedSeconds, start, pause, reset, studyStats, refreshStats }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
