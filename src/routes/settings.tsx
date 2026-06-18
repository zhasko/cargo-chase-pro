import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Баптаулар — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

function Settings() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  if (!user) return null;

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.settings")}</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <label className="step-label active" style={{ display: "block", marginBottom: 6 }}>Тіл / Язык / Language</label>
        <select className="input" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="kk">Қазақша</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
        <div style={{ marginTop: 16 }}>
          <div className="step-label active">{t("profile.phone")}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{user.phone}</div>
        </div>
      </div>
    </AppShell>
  );
}
