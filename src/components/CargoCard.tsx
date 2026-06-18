import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { kzt, shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { toggleFavorite, listFavorites } from "@/lib/services";
import { useAuth } from "@/lib/store";
import type { Order } from "@/lib/types";
import { Icon } from "./icons";

export function CargoCard({ order }: { order: Order }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fav, setFav] = useState(() => listFavorites().includes(order.id));

  const onFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const next = await toggleFavorite(order.id);
    setFav(next);
    toast.success(next ? "★" : "☆");
  };

  return (
    <div className="cargo-card" onClick={() => navigate({ to: "/orders/$id", params: { id: order.id } })}>
      <div className="flex items-center justify-between" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="cargo-card-route">
          <span>{order.from_city}</span>
          <Icon.arrow style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{order.to_city}</span>
        </div>
        <button className={`fav-btn${fav ? " active" : ""}`} onClick={onFav} aria-label="favorite">
          {fav ? <Icon.heartFilled /> : <Icon.heart />}
        </button>
      </div>
      <div className="cargo-card-name">{order.cargo_name}</div>
      <div className="cargo-chips">
        <span className="chip">{order.vehicle_type}</span>
        <span className="chip">{order.weight} т</span>
        <span className="chip">{order.volume} м³</span>
        <span className="chip">
          <Icon.calendar style={{ width: 11, height: 11 }} /> {shortDate(order.loading_date)}
        </span>
      </div>
      <div className="cargo-bottom">
        <div className="cargo-price">{order.negotiable ? t("order.negotiable") : kzt(order.price)}</div>
        <span className="chip">
          <Icon.eye style={{ width: 11, height: 11 }} /> {order.views}
        </span>
      </div>
    </div>
  );
}
