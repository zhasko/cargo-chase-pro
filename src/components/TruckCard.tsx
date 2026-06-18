import { useNavigate } from "@tanstack/react-router";
import { shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Truck, User } from "@/lib/types";
import { Icon } from "./icons";

export function TruckCard({ truck, driver }: { truck: Truck; driver?: User }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="truck-card" style={{ cursor: "pointer" }} onClick={() => navigate({ to: "/trucks/$id", params: { id: truck.id } })}>
      <div className="cargo-card-route">
        <span>{truck.current_city}</span>
        <Icon.arrow style={{ width: 16, height: 16, flexShrink: 0 }} />
        <span>{truck.destination_city === "any" ? t("truck.anyDirection") : truck.destination_city}</span>
      </div>
      {driver && <div className="cargo-card-name">{driver.company_name || driver.full_name}</div>}
      <div className="cargo-chips">
        <span className="chip">{truck.vehicle_type}</span>
        <span className="chip">{truck.load_capacity} т</span>
        <span className="chip">{truck.volume} м³</span>
        <span className="chip">
          <Icon.calendar style={{ width: 11, height: 11 }} /> {shortDate(truck.ready_date)}
        </span>
      </div>
      {truck.comment && <div className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>{truck.comment}</div>}
    </div>
  );
}
