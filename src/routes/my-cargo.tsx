import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { kzt, shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { listMyOrders, setOrderStatus } from "@/lib/services";
import { useAuth } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/my-cargo")({
  head: () => ({ meta: [{ title: "Менің жүктерім — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: MyCargo;
});

function MyCargo() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const { data, isLoading } = useQuery({ queryKey: ["my-orders", user?.id], queryFn: () => listMyOrders(user!.id), enabled: !!user });

  const act = async (id: string, status: OrderStatus, msg: string) => {
    await setOrderStatus(id, status);
    qc.invalidateQueries({ queryKey: ["my-orders"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    toast.success(msg);
  };

  if (!user) return null;

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.myCargo")}</h1>

      {isLoading ? (
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>{t("common.loading")}</div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title={t("order.noOrders")} icon="boxes" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {data!.map((o) => (
            <div className="card" key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div className="cargo-card-route" style={{ fontSize: 16 }}>
                  <span>{o.from_city}</span><Icon.arrow style={{ width: 14, height: 14 }} /><span>{o.to_city}</span>
                </div>
                <span className={`chip ${o.status === "active" ? "success" : o.status === "archived" ? "warning" : ""}`}>{t(`status.${o.status}`)}</span>
              </div>
              <div className="cargo-card-name">{o.cargo_name} · {o.negotiable ? t("order.negotiable") : kzt(o.price)} · {shortDate(o.loading_date)}</div>
              <div className="cargo-actions">
                <button className="btn ghost" onClick={() => navigate({ to: "/orders/$id", params: { id: o.id } })}><Icon.eye style={{ width: 14, height: 14 }} /> {t("common.view")}</button>
                <button className="btn ghost" onClick={() => navigate({ to: "/orders/$id/edit", params: { id: o.id } })}><Icon.edit style={{ width: 14, height: 14 }} /> {t("common.edit")}</button>
                {o.status === "active" ? (
                  <button className="btn ghost" onClick={() => act(o.id, "archived", t("common.success"))}><Icon.archive style={{ width: 14, height: 14 }} /></button>
                ) : (
                  <button className="btn accent" onClick={() => act(o.id, "active", t("order.publishSuccess"))}><Icon.rotate style={{ width: 14, height: 14 }} /></button>
                )}
                <button className="btn danger" onClick={() => act(o.id, "deleted", t("common.success"))}><Icon.trash style={{ width: 14, height: 14 }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
