import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, ready, switchRole, loginExisting } = useAuth();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    role: "cargo_owner" as Role,
  });

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth" });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;

    setForm({
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
      role: user.role,
    });
  }, [user?.id]);

  const set = (p: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...p }));
  };

  const save = async () => {
    if (!user) return;

    if (!form.full_name.trim()) {
      toast.error("Аты-жөніңізді енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          company_name: form.company_name.trim() || null,
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      let updatedUser = {
        id: data.id,
        phone: data.phone,
        full_name: data.full_name,
        company_name: data.company_name ?? undefined,
        role: data.role,
        status: data.status ?? "active",
        created_at: data.created_at,
      };

      if (form.role !== user.role) {
        await switchRole(form.role);

        updatedUser = {
          ...updatedUser,
          role: form.role,
        };
      } else {
        loginExisting(updatedUser);
      }

      toast.success("Баптаулар сақталды");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e?.message || "Сақтау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>
        ← {t("common.back")}
      </button>

      <h1 className="page-title">Баптаулар</h1>
      <p className="page-sub">Профиль мәліметтерін өзгерту</p>

      <div
        className="card"
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <label>
          <div className="step-label active" style={{ marginBottom: 6 }}>
            Аты-жөні
          </div>

          <input
            className="input"
            value={form.full_name}
            onChange={(e) => set({ full_name: e.target.value })}
          />
        </label>

        <label>
          <div className="step-label active" style={{ marginBottom: 6 }}>
            Компания атауы
          </div>

          <input
            className="input"
            value={form.company_name}
            onChange={(e) => set({ company_name: e.target.value })}
            placeholder="Міндетті емес"
          />
        </label>

        <label>
          <div className="step-label active" style={{ marginBottom: 6 }}>
            Телефон
          </div>

          <input className="input" value={form.phone} disabled />

          <p className="text-muted" style={{ marginTop: 6, fontSize: 12 }}>
            Телефон нөмірін өзгерту мүмкін емес
          </p>
        </label>

        <div>
          <div className="step-label active" style={{ marginBottom: 8 }}>
            Активті рөл
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              className={form.role === "cargo_owner" ? "btn primary" : "btn ghost"}
              onClick={() => set({ role: "cargo_owner" })}
            >
              Жүк иесі
            </button>

            <button
              type="button"
              className={form.role === "driver" ? "btn primary" : "btn ghost"}
              onClick={() => set({ role: "driver" })}
            >
              Жүргізуші
            </button>
          </div>
        </div>

        <div className="locked-box">
          <div className="step-label active">Аккаунт</div>

          <p className="text-muted" style={{ marginTop: 6, fontSize: 13 }}>
            Тіркелген күні: {new Date(user.created_at).toLocaleDateString("kk-KZ")}
          </p>
        </div>

        <button className="btn accent" disabled={busy} onClick={save}>
          {busy ? "Сақталуда..." : "Сақтау"}
        </button>
      </div>
    </AppShell>
  );
}