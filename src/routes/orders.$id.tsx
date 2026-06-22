import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { ComplaintModal } from "@/components/ComplaintModal";
import { kzt, maskPhones, shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  getOrder,
  getUser,
  bumpPhoneView,
  bumpView,
  isSubscriptionActiveAsync,
} from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = useParams({ from: "/orders/$id" });
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [revealed, setRevealed] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [viewBumped, setViewBumped] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });

  const { data: owner } = useQuery({
    queryKey: ["user", order?.owner_id],
    queryFn: () => getUser(order!.owner_id),
    enabled: !!order,
  });

  const { data: hasActiveSubscription = false } = useQuery({
    queryKey: ["subscription-active", user?.id],
    queryFn: () => isSubscriptionActiveAsync(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!order || viewBumped) return;

    if (user?.id !== order.owner_id) {
      bumpView(order.id);
      setViewBumped(true);
    }
  }, [order, user?.id, viewBumped]);

  if (isLoading) {
    return (
      <AppShell width="medium">
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell width="medium">
        <div style={{ padding: 40, textAlign: "center" }}>404</div>
      </AppShell>
    );
  }

  const isOwner = user?.id === order.owner_id;
  const isAdmin = user?.role === "admin";
  const canSeePhone = isOwner || isAdmin || hasActiveSubscription;

  const reveal = async () => {
    if (!user) {
      toast.error("Номерді көру үшін алдымен кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    if (!canSeePhone) {
      toast.error("Номерді көру үшін жазылым қажет");
      navigate({ to: "/subscription" as any });
      return;
    }

    await bumpPhoneView(order.id);
    setRevealed(true);
  };

  const goToSubscribe = () => {
    if (!user) {
      toast.error("Алдымен аккаунтқа кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    toast.info("Номерді көру үшін жазылым сатып алыңыз");
    navigate({ to: "/subscription" as any });
  };

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/orders" })}>
        ← {t("common.back")}
      </button>

      <div className="order-hero">
        <div className="cargo-card-route" style={{ fontSize: 22 }}>
          <span>{order.from_city}</span>
          <Icon.arrow style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{order.to_city}</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>
          {order.cargo_name}
        </div>

        <div className="cargo-chips" style={{ marginTop: 12 }}>
          <span className="chip accent">{order.vehicle_type}</span>
          <span className="chip">
            <Icon.calendar style={{ width: 11, height: 11 }} /> {shortDate(order.loading_date)}
          </span>
          <span className="chip">
            <Icon.eye style={{ width: 11, height: 11 }} /> {order.views}{" "}
            {t("order.views").toLowerCase()}
          </span>
        </div>

        <div className="order-price-box">
          <label>{t("order.price")}</label>
          <div className="order-price-val">
            {order.negotiable ? t("order.negotiable") : kzt(order.price)}
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="il">
              <Icon.bar style={{ width: 12, height: 12 }} /> {t("order.weight")}
            </div>
            <div className="iv">{order.weight} т</div>
          </div>

          <div className="info-item">
            <div className="il">
              <Icon.boxes style={{ width: 12, height: 12 }} /> {t("order.volume")}
            </div>
            <div className="iv">{order.volume} м³</div>
          </div>
        </div>

        {order.comment && (
          <div className="info-item" style={{ marginTop: 10 }}>
            <div className="il">{t("order.comment")}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{maskPhones(order.comment || "")}</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="route-step">
          <div
            className="route-dot"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Icon.mapPin style={{ width: 14, height: 14 }} />
          </div>

          <div>
            <div style={{ fontWeight: 800 }}>{order.from_city}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {canSeePhone
                ? order.from_address || "—"
                : "•••••• (жазылым қажет)"}
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "2px dashed var(--border)", height: 24, marginLeft: 13 }} />

        <div className="route-step">
          <div
            className="route-dot"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            <Icon.mapPin style={{ width: 14, height: 14 }} />
          </div>

          <div>
            <div style={{ fontWeight: 800 }}>{order.to_city}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {canSeePhone ? order.to_address || "—" : "•••••• (жазылым қажет)"}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>
          {owner?.company_name || owner?.full_name || "—"}
        </div>

        {canSeePhone && revealed ? (
          <a
            href={`tel:${order.contact_phone || owner?.phone}`}
            className="btn accent w-full"
            style={{ width: "100%" }}
          >
            <Icon.phone style={{ width: 16, height: 16 }} />{" "}
            {order.contact_phone || owner?.phone}
          </a>
        ) : canSeePhone ? (
          <button className="btn primary w-full" style={{ width: "100%" }} onClick={reveal}>
            <Icon.phone style={{ width: 16, height: 16 }} /> {t("order.showPhone")}
          </button>
        ) : (
          <div className="locked-box">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon.lock style={{ width: 18, height: 18 }} />

              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  Номерді көру үшін жазылым қажет
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Жазылым сатып алғаннан кейін жүк иесінің номері мен мекенжайы ашылады.
                </div>
              </div>
            </div>

            <button
              className="btn primary w-full"
              style={{ width: "100%", marginTop: 12 }}
              onClick={goToSubscribe}
            >
              {user ? "Жазылым алу" : t("common.login")}
            </button>
          </div>
        )}

        {!isOwner && (
          <button
            className="back-btn"
            style={{ marginTop: 14, marginBottom: 0 }}
            onClick={() => (user ? setComplaintOpen(true) : navigate({ to: "/auth" }))}
          >
            <Icon.flag style={{ width: 14, height: 14 }} /> {t("complaint.title")}
          </button>
        )}
      </div>

      {complaintOpen && (
        <ComplaintModal targetType="order" targetId={order.id} onClose={() => setComplaintOpen(false)} />
      )}
    </AppShell>
  );
}