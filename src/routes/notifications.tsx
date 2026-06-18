import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { listNotifications } from "@/lib/services";
import { shortDate } from "@/lib/format";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Хабарламалар — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Notifications,
});

function Notifications() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);

  const { data } = useQuery({ queryKey: ["notifs", user?.id], queryFn: () => listNotifications(user!.id), enabled: !!user });

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("nav.notifications")}</h1>
      {(data?.length ?? 0) === 0 ? (
        <EmptyState title={t("common.empty")} icon="bell" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {data!.map((n) => (
            <div className="notif-item" key={n.id}>
              {!n.read && <div className="notif-dot" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{n.title}</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>{n.body}</div>
                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>{shortDate(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
