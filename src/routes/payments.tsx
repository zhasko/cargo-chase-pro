import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { kzt, shortDate } from "@/lib/format";
import { listPayments } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Төлем тарихы — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Payments,
});

function Payments() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  const { data } = useQuery({ queryKey: ["payments", user?.id], queryFn: () => listPayments(user!.id), enabled: !!user });

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.payments")}</h1>
      {(data?.length ?? 0) === 0 ? (
        <EmptyState title={t("common.empty")} icon="credit" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {data!.map((p) => (
            <div className="card" key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{kzt(p.amount)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{p.plan} · {shortDate(p.created_at)}</div>
              </div>
              <span className={`chip ${p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "danger"}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
