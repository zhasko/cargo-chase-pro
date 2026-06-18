import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK_USERS } from "./mock-data";
import { isSubscriptionActive } from "./services";
import type { Role, User } from "./types";

const SESSION_KEY = "argo_session_v1";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  hasActiveSub: boolean;
  /** returns existing user if phone is registered, otherwise null */
  findByPhone: (phone: string) => User | null;
  loginExisting: (user: User) => void;
  register: (data: { phone: string; full_name: string; role: Role; company_name?: string }) => User;
  logout: () => void;
  switchRole: (role: Role) => void;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function normalizePhone(p: string) {
  return p.replace(/\D/g, "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (typeof localStorage !== "undefined") {
      if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      else localStorage.removeItem(SESSION_KEY);
    }
  };

  const findByPhone = (phone: string): User | null => {
    const n = normalizePhone(phone);
    return MOCK_USERS.find((u) => normalizePhone(u.phone) === n) || null;
  };

  const loginExisting = (u: User) => persist(u);

  const register: AuthCtx["register"] = (data) => {
    const u: User = {
      id: "me_" + normalizePhone(data.phone),
      phone: data.phone,
      full_name: data.full_name,
      role: data.role,
      status: "active",
      created_at: new Date().toISOString(),
      company_name: data.company_name,
    };
    persist(u);
    return u;
  };

  const logout = () => persist(null);

  const switchRole = (role: Role) => {
    if (!user) return;
    persist({ ...user, role });
  };

  const hasActiveSub = user ? user.role === "cargo_owner" || isSubscriptionActive(user.id) : false;

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        hasActiveSub,
        findByPhone,
        loginExisting,
        register,
        logout,
        switchRole,
        refresh: () => setTick((t) => t + 1),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
