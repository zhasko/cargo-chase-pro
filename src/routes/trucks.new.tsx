import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { createTruck, isSubscriptionActive } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/trucks/new")({
  head: () => ({ meta: [{ title: "Көлік жариялау — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: TruckNew,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function TruckNew() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    current_city: CITIES[0], destination_city: "any", vehicle_type: VEHICLE_TYPES[0],
    load_capacity: "", volume: "", ready_date: todayISO(), comment: "",
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const submit = async () => {
    if (!user) return;
    if (!isSubscriptionActive(user.id)) {
      toast.error(t("order.contactLockedDesc"));
      navigate({ to: "/pricing" });
      return;
    }
    setBusy(true);
    await createTruck({
      current_city: form.current_city,
      destination_city: form.destination_city,
      vehicle_type: form.vehicle_type,
      load_capacity: Number(form.load_capacity) || 0,
      volume: Number(form.volume) || 0,
      ready_date: new Date(form.ready_date).toISOString(),
      comment: form.comment || undefined,
    }, user.id);
    setBusy(false);
    toast.success(t("truck.publishSuccess"));
    navigate({ to: "/trucks" });
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("truck.publishTitle")}</h1>
      <p className="page-sub">{t("truck.activeSearch")}</p>

      <div className="card" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <L label={t("truck.current")}>
          <select className="input" value={form.current_city} onChange={(e) => set({ current_city: e.target.value })}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </L>
        <L label={t("truck.destination")}>
          <select className="input" value={form.destination_city} onChange={(e) => set({ destination_city: e.target.value })}>
            <option value="any">{t("truck.anyDirection")}</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </L>
        <L label={t("order.vehicleType")}>
          <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>
            {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </L>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <L label={t("auth.capacity")}>
            <input className="input" type="number" value={form.load_capacity} onChange={(e) => set({ load_capacity: e.target.value })} />
          </L>
          <L label={t("order.volume")}>
            <input className="input" type="number" value={form.volume} onChange={(e) => set({ volume: e.target.value })} />
          </L>
        </div>
        <L label={t("truck.readyDate")}>
          <input className="input" type="date" value={form.ready_date} onChange={(e) => set({ ready_date: e.target.value })} />
        </L>
        <L label={t("truck.comment")}>
          <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} value={form.comment} onChange={(e) => set({ comment: e.target.value })} />
        </L>
        <button className="btn accent" disabled={busy} onClick={submit}>{t("common.publish")}</button>
      </div>
    </AppShell>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="step-label active" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
