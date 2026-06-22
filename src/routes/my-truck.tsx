import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { listMyTrucks, setTruckStatus } from "@/lib/services";
import { useAuth } from "@/lib/store";
import type { Truck } from "@/lib/types";

export const Route = createFileRoute("/my-truck")({
  head: () => ({
    meta: [
      { title: "Менің көліктерім — ARGO" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyTruck,
});

function MyTruck() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth" });
    }
  }, [ready, user, navigate]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["my-trucks", user?.id],
    queryFn: () => listMyTrucks(user!.id),
    enabled: !!user,
  });

  const active = data.filter((truck) => truck.status === "active");
  const archived = data.filter(
    (truck) => truck.status === "archived" || truck.status === "inactive"
  );

  const changeStatus = async (
    id: string,
    status: "active" | "inactive" | "archived" | "deleted",
    message: string
  ) => {
    try {
      await setTruckStatus(id, status);

      await qc.invalidateQueries({ queryKey: ["my-trucks"] });
      await qc.invalidateQueries({ queryKey: ["trucks"] });
      await qc.invalidateQueries({ queryKey: ["truck", id] });

      toast.success(message);
    } catch (e: any) {
      toast.error(e?.message || "Қате шықты");
    }
  };

  if (!user) return null;

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>
        ← {t("common.back")}
      </button>

      <div className="sec-header">
        <div>
          <h1 className="page-title">Менің көліктерім</h1>
          <p className="page-sub">{data.length} жарияланым</p>
        </div>

        <button className="btn primary" onClick={() => navigate({ to: "/trucks/new" })}>
          <Icon.plus style={{ width: 16, height: 16 }} />
          Көлік қосу
        </button>
      </div>

      {isLoading ? (
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="Көлік жоқ"
          description="Бос көлігіңізді қосып, жүк иелеріне ұсыныс қалдырыңыз"
          icon="truck"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
              Белсенді
            </h2>

            {active.length === 0 ? (
              <div className="card text-muted" style={{ fontSize: 13 }}>
                Белсенді көлік жоқ
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {active.map((truck) => (
                  <TruckRow
                    key={truck.id}
                    truck={truck}
                    archived={false}
                    onView={() => navigate({ to: "/trucks/$id", params: { id: truck.id } })}
                    onEdit={() => navigate({ to: "/trucks/$id/edit", params: { id: truck.id } })}
                    onArchive={() => changeStatus(truck.id, "archived", "Архивке жіберілді")}
                    onDelete={() => {
                      if (confirm("Көлікті жоюды растайсыз ба?")) {
                        changeStatus(truck.id, "deleted", "Көлік жойылды");
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
              Архив
            </h2>

            {archived.length === 0 ? (
              <div className="card text-muted" style={{ fontSize: 13 }}>
                Архивте көлік жоқ
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {archived.map((truck) => (
                  <TruckRow
                    key={truck.id}
                    truck={truck}
                    archived
                    onView={() => navigate({ to: "/trucks/$id", params: { id: truck.id } })}
                    onEdit={() => navigate({ to: "/trucks/$id/edit", params: { id: truck.id } })}
                    onRestore={() => changeStatus(truck.id, "active", "Қайта қосылды")}
                    onDelete={() => {
                      if (confirm("Көлікті жоюды растайсыз ба?")) {
                        changeStatus(truck.id, "deleted", "Көлік жойылды");
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function TruckRow({
  truck,
  archived,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  truck: Truck;
  archived?: boolean;
  onView: () => void;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="cargo-card-route" style={{ fontSize: 16 }}>
            <span>{truck.current_city}</span>
            <Icon.arrow style={{ width: 14, height: 14 }} />
            <span>
              {truck.destination_city === "any" ? "Кез келген бағыт" : truck.destination_city}
            </span>
          </div>

          <div className="cargo-card-name">
            {truck.vehicle_type} · {truck.load_capacity} т · {truck.volume} м³ ·{" "}
            {shortDate(truck.ready_date)}
          </div>

          {truck.comment && (
            <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>
              {truck.comment}
            </p>
          )}

          <div className="cargo-chips">
            <span className={`chip ${truck.status === "active" ? "success" : "warning"}`}>
              {truck.status === "active" ? "Белсенді" : "Архив"}
            </span>

            <span className="chip">
              <Icon.eye style={{ width: 11, height: 11 }} /> {truck.views || 0}
            </span>

            <span className="chip">
              <Icon.phone style={{ width: 11, height: 11 }} /> {truck.phone_views || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="cargo-actions">
        <button className="btn ghost" onClick={onView}>
          <Icon.eye style={{ width: 14, height: 14 }} />
          Қарау
        </button>

        <button className="btn ghost" onClick={onEdit}>
          <Icon.edit style={{ width: 14, height: 14 }} />
          Өзгерту
        </button>

        {archived ? (
          <button className="btn accent" onClick={onRestore}>
            <Icon.rotate style={{ width: 14, height: 14 }} />
            Қайта қосу
          </button>
        ) : (
          <button className="btn ghost" onClick={onArchive}>
            <Icon.archive style={{ width: 14, height: 14 }} />
            Архив
          </button>
        )}

        <button className="btn danger" onClick={onDelete}>
          <Icon.trash style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}