import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { ComplaintModal } from "@/components/ComplaintModal";
import { shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  getTruck,
  getUser,
  bumpTruckPhoneView,
  bumpTruckView,
  isSubscriptionActiveAsync,
} from "@/lib/services";
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
  const [revealed, setRevealed] = useState(false);
  const [viewBumped, setViewBumped] = useState(false);

  const { data: truck, isLoading } = useQuery({
    queryKey: ["truck", id],
    queryFn: () => getTruck(id),
  });

  const { data: driver } = useQuery({
    queryKey: ["user", truck?.driver_id],
    queryFn: () => getUser(truck!.driver_id),
    enabled: !!truck,
  });

  const { data: hasActiveSubscription = false } = useQuery({
    queryKey: ["subscription-active", user?.id],
    queryFn: () => isSubscriptionActiveAsync(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!truck || viewBumped) return;

    if (user?.id !== truck.driver_id) {
      bumpTruckView(truck.id);
      setViewBumped(true);
    }
  }, [truck, user?.id, viewBumped]);

  if (isLoading) {
    return (
      <AppShell width="medium">
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      </AppShell>
    );
  }

  if (!truck) {
    return (
      <AppShell width="medium">
        <div style={{ padding: 40, textAlign: "center" }}>404</div>
      </AppShell>
    );
  }

  const isOwner = user?.id === truck.driver_id;
  const isAdmin = user?.role === "admin";
  const canSeePhone = isOwner || isAdmin || hasActiveSubscription;

  const revealPhone = async () => {
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

    if (!isOwner && !isAdmin && !revealed) {
      await bumpTruckPhoneView(truck.id);
    }

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
      <button className="back-btn" onClick={() => navigate({ to: "/trucks" })}>
        ← {t("common.back")}
      </button>

      <div className="order-hero">
        <div className="cargo-card-route" style={{ fontSize: 22 }}>
          <span>{truck.current_city}</span>
          <Icon.arrow style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>
            {truck.destination_city === "any" ? t("truck.anyDirection") : truck.destination_city}
          </span>
        </div>

        <div className="cargo-chips" style={{ marginTop: 12 }}>
          <span className="chip accent">{truck.vehicle_type}</span>
          <span className="chip">
            <Icon.calendar style={{ width: 11, height: 11 }} /> {shortDate(truck.ready_date)}
          </span>
          <span className="chip">
            <Icon.eye style={{ width: 11, height: 11 }} /> {truck.views || 0}
          </span>
          <span className="chip">
            <Icon.phone style={{ width: 11, height: 11 }} /> {truck.phone_views || 0}
          </span>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="il">{t("truck.capacity")}</div>
            <div className="iv">{truck.load_capacity} т</div>
          </div>

          <div className="info-item">
            <div className="il">{t("order.volume")}</div>
            <div className="iv">{truck.volume} м³</div>
          </div>
        </div>

        {truck.comment && (
          <p className="text-muted" style={{ fontSize: 13, marginTop: 14 }}>
            {truck.comment}
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>
          {driver?.company_name || driver?.full_name || "—"}
        </div>

        <div className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
          {t("truck.driver")}
        </div>

        {canSeePhone && revealed ? (
          <a
            href={`tel:${truck.contact_phone || driver?.phone}`}
            className="btn accent w-full"
            style={{ width: "100%" }}
          >
            <Icon.phone style={{ width: 16, height: 16 }} />{" "}
            {truck.contact_phone || driver?.phone}
          </a>
        ) : canSeePhone ? (
          <button className="btn primary w-full" style={{ width: "100%" }} onClick={revealPhone}>
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
                  Жазылым сатып алғаннан кейін жүргізушінің номері ашылады.
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
        <ComplaintModal targetType="truck" targetId={truck.id} onClose={() => setComplaintOpen(false)} />
      )}
    </AppShell>
  );
}