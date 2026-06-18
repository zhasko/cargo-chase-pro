import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { ComplaintModal } from "@/components/ComplaintModal";
import { shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getTruck, getUser } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/trucks/$id")({
  component: TruckDetail,
});

function TruckDetail() {
  const { id } = useParams({ from: "/trucks/$id" });
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(false);

  const { data: truck, isLoading } = useQuery({ queryKey: ["truck", id], queryFn: () => getTruck(id) });
  const { data: driver } = useQuery({ queryKey: ["user", truck?.driver_id], queryFn: () => getUser(truck!.driver_id), enabled: !!truck });

  if (isLoading) return <AppShell width="medium"><div className="text-muted" style={{ padding: 40, textAlign: "center" }}>{t("common.loading")}</div></AppShell>;
  if (!truck) return <AppShell width="medium"><div style={{ padding: 40, textAlign: "center" }}>404</div></AppShell>;

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/trucks" })}>← {t("common.back")}</button>
      <div className="order-hero">
        <div className="cargo-card-route" style={{ fontSize: 22 }}>
          <span>{truck.current_city}</span>
          <Icon.arrow style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{truck.destination_city === "any" ? t("truck.anyDirection") : truck.destination_city}</span>
        </div>
        <div className="cargo-chips" style={{ marginTop: 12 }}>
          <span className="chip accent">{truck.vehicle_type}</span>
          <span className="chip"><Icon.calendar style={{ width: 11, height: 11 }} /> {shortDate(truck.ready_date)}</span>
        </div>
        <div className="info-grid">
          <div className="info-item"><div className="il">{t("truck.capacity")}</div><div className="iv">{truck.load_capacity} т</div></div>
          <div className="info-item"><div className="il">{t("order.volume")}</div><div className="iv">{truck.volume} м³</div></div>
        </div>
        {truck.comment && <p className="text-muted" style={{ fontSize: 13, marginTop: 14 }}>{truck.comment}</p>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{driver?.company_name || driver?.full_name}</div>
        <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>{t("truck.driver")}</div>
        {user ? (
          <a href={`tel:${driver?.phone}`} className="btn accent w-full" style={{ width: "100%" }}>
            <Icon.phone style={{ width: 16, height: 16 }} /> {driver?.phone}
          </a>
        ) : (
          <button className="btn primary w-full" style={{ width: "100%" }} onClick={() => navigate({ to: "/auth" })}>
            <Icon.lock style={{ width: 16, height: 16 }} /> {t("common.login")}
          </button>
        )}
        <button className="back-btn" style={{ marginTop: 14, marginBottom: 0 }} onClick={() => (user ? setComplaintOpen(true) : navigate({ to: "/auth" }))}>
          <Icon.flag style={{ width: 14, height: 14 }} /> {t("complaint.title")}
        </button>
      </div>

      {complaintOpen && <ComplaintModal targetType="truck" targetId={truck.id} onClose={() => setComplaintOpen(false)} />}
    </AppShell>
  );
}
