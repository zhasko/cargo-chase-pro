import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { isSubscriptionActive, startTrialSubscription } from "./services";
import type { Role, User } from "./types";

const SESSION_KEY = "argo_session_v1";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  hasActiveSub: boolean;
  findByPhone: (phone: string) => Promise<User | null>;
  loginExisting: (user: User) => void;
  register: (data: {
    phone: string;
    full_name: string;
    role: Role;
    company_name?: string;
    vehicle_type?: string;
    load_capacity?: number;
    volume?: number;
    current_city?: string;
  }) => Promise<User>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("8") && digits.length === 11) {
    return "+7" + digits.slice(1);
  }

  if (digits.startsWith("7")) {
    return "+" + digits;
  }

  return "+" + digits;
}

function mapProfile(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    full_name: row.full_name,
    company_name: row.company_name ?? undefined,
    role: row.role,
    status: row.status ?? "active",
    created_at: row.created_at,
  };
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
      // ignore
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

  const findByPhone = async (phone: string): Promise<User | null> => {
    const normalizedPhone = normalizePhone(phone);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (error) {
      console.error("findByPhone error:", error);
      return null;
    }

    return data ? mapProfile(data) : null;
  };

  const loginExisting = (u: User) => {
    if (u.status === "blocked") {
      throw new Error("Бұл аккаунт бұғатталған");
    }

    persist(u);
  };

  const register: AuthCtx["register"] = async (data) => {
    const normalizedPhone = normalizePhone(data.phone);

    const { data: profile, error } = await supabase
  .from("profiles")
  .insert({
    phone: normalizedPhone,
    full_name: data.full_name,
    company_name: data.company_name || null,
    role: data.role,
    status: "active",
  })
  .select("*")
  .single();

if (error) {
  console.error("register profile error:", error);
  throw new Error(error.message);
}

await startTrialSubscription(profile.id);

    const user = mapProfile(profile);
    persist(user);

    return user;
  };

  const logout = () => {
    persist(null);
  };

  const switchRole = async (role: Role) => {
  if (!user) return;

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("switchRole error:", error);
    throw new Error(error.message);
  }

  const updatedUser = mapProfile(data);

  persist(updatedUser);
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

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}