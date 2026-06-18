import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { shortDate, daysUntil } from "@/lib/format";
import { getSubscriptionSync, subscribe } from "@/lib/services";
import { PAYMENT_METHODS } from "@/lib/mock-data";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/subscription")({
  head: () => ({ meta: [{ title: "Жазылым — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [, force] = useState(0);
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  if (!user) return null;

  const sub = getSubscriptionSync(user.id);
  const active = sub && new Date(sub.expires_at).getTime() > Date.now();
  const left = daysUntil(sub?.expires_at);

  const renew = async () => {
    await subscribe(user.id, "monthly");
    toast.success(t("sub.active"));
    force((x) => x + 1);
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.subscription")}</h1>

      <div className={`sub-status ${active ? "active" : "expired"}`} style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{active ? t("sub.active") : t("sub.expired")}</div>
        {sub && (
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {t("sub.plan")}: {sub.plan} · {shortDate(sub.expires_at)} {active ? `· ${left} ${t("sub.expiresIn")}` : ""}
          </div>
        )}
      </div>

      <button className="btn primary w-full" style={{ width: "100%", marginTop: 16 }} onClick={() => navigate({ to: "/pricing" })}>{t("sub.renew")}</button>
      {active && <button className="btn ghost w-full" style={{ width: "100%", marginTop: 10 }} onClick={renew}>+30 {t("sub.expiresIn")}</button>}

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>{t("common.subscribe")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PAYMENT_METHODS.map((m) => <span className="chip" key={m.id}>{m.label}</span>)}
        </div>
      </div>
    </AppShell>
  );
}
