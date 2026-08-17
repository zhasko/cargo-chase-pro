import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const [fav, setFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const orderPath = `/orders/${order.id}`;

  // Supabase-тан осы қолданушының таңдаулысын тексеру
  useEffect(() => {
    let cancelled = false;

    const loadFavorite = async () => {
      if (!user?.id) {
        setFav(false);
        return;
      }

      try {
        const favorites = await listFavorites(user.id);

        if (!cancelled) {
          setFav(favorites.includes(order.id));
        }
      } catch (error) {
        console.error("load favorite error:", error);

        if (!cancelled) {
          setFav(false);
        }
      }
    };

    loadFavorite();

    return () => {
      cancelled = true;
    };
  }, [user?.id, order.id]);

  const onFav = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: orderPath },
      });
      return;
    }

    if (favBusy) return;

    setFavBusy(true);

    try {
      const next = await toggleFavorite(user.id, order.id);

      setFav(next);

      toast.success(
        next
          ? "Таңдаулыға қосылды"
          : "Таңдаулыдан алынды"
      );
    } catch (error: any) {
      console.error("toggle favorite error:", error);

      toast.error(
        error?.message ||
          "Таңдаулыларды өзгерту кезінде қате шықты"
      );
    } finally {
      setFavBusy(false);
    }
  };

  return (
    <div
      className="cargo-card"
      role="button"
      tabIndex={0}
      onClick={() =>
        navigate({
          to: "/orders/$id",
          params: { id: order.id },
        })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          navigate({
            to: "/orders/$id",
            params: { id: order.id },
          });
        }
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div className="cargo-card-route">
          <span>{order.from_city}</span>

          <Icon.arrow
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
            }}
          />

          <span>{order.to_city}</span>
        </div>

        <button
          type="button"
          className={`fav-btn${fav ? " active" : ""}`}
          onClick={onFav}
          disabled={favBusy}
          aria-label={
            fav
              ? "Таңдаулыдан алу"
              : "Таңдаулыға қосу"
          }
        >
          {fav ? (
            <Icon.heartFilled />
          ) : (
            <Icon.heart />
          )}
        </button>
      </div>

      <div className="cargo-card-name">
        {order.cargo_name}
      </div>

      <div className="cargo-chips">
        <span className="chip">
          {order.vehicle_type}
        </span>

        <span className="chip">
          {order.weight} т
        </span>

        <span className="chip">
          {order.volume} м³
        </span>

        <span className="chip">
          <Icon.calendar
            style={{
              width: 11,
              height: 11,
            }}
          />{" "}
          {shortDate(order.loading_date)}
        </span>
      </div>

      <div className="cargo-bottom">
        <div className="cargo-price">
          {order.negotiable
            ? t("order.negotiable")
            : kzt(order.price)}
        </div>

        <span className="chip">
          <Icon.eye
            style={{
              width: 11,
              height: 11,
            }}
          />{" "}
          {order.views}
        </span>
      </div>
    </div>
  );
}