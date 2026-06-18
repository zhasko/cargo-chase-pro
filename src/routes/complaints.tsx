import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { shortDate } from "@/lib/format";
import { listMyComplaints } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/complaints")({
  head: () => ({ meta: [{ title: "Шағымдар — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Complaints,
});

function Complaints() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  const { data } = useQuery({ queryKey: ["my-complaints", user?.id], queryFn: () => listMyComplaints(user!.id), enabled: !!user });

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.complaints")}</h1>
      {(data?.length ?? 0) === 0 ? (
        <EmptyState title={t("common.empty")} icon="flag" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {data!.map((c) => (
            <div className="card" key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{t(`complaint.${c.reason}`)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{shortDate(c.created_at)}</div>
              </div>
              <span className={`chip ${c.status === "new" ? "warning" : c.status === "closed" ? "success" : ""}`}>{t(`complaint.status_${c.status}`)}</span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
