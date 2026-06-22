import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { listMyOrders } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/statistics")({
  component: () => null,
});

function Statistics() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  const { data } = useQuery({ queryKey: ["my-orders", user?.id], queryFn: () => listMyOrders(user!.id), enabled: !!user });

  const orders = data ?? [];
  const stats = [
    { label: t("admin.activeOrders"), val: orders.filter((o) => o.status === "active").length },
    { label: t("admin.archivedOrders"), val: orders.filter((o) => o.status === "archived").length },
    { label: t("order.views"), val: orders.reduce((a, o) => a + o.views, 0) },
    { label: t("order.phoneViews"), val: orders.reduce((a, o) => a + o.phone_views, 0) },
  ];

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.stats")}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 18 }}>
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
