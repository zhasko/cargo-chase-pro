import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { getTruck, updateTruck } from "@/lib/services";
import { useAuth } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/trucks/$id/edit")({
  component: TruckEdit,
});

function TruckEdit() {
  const { id } = useParams({ from: "/trucks/$id/edit" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useI18n();
  const { user, ready } = useAuth();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    current_city: CITIES[0],
    destination_city: "any",
    vehicle_type: VEHICLE_TYPES[0],
    load_capacity: "",
    volume: "",
    ready_date: new Date().toISOString().slice(0, 10),
    comment: "",
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const { data: truck, isLoading } = useQuery({
    queryKey: ["truck", id],
    queryFn: () => getTruck(id),
  });

  useEffect(() => {
    if (!truck) return;

    setForm({
      current_city: truck.current_city || CITIES[0],
      destination_city: truck.destination_city || "any",
      vehicle_type: truck.vehicle_type || VEHICLE_TYPES[0],
      load_capacity: String(truck.load_capacity || ""),
      volume: String(truck.volume || ""),
      ready_date: truck.ready_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      comment: truck.comment || "",
    });
  }, [truck?.id]);

  const set = (p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
  };

  const save = async () => {
    if (!truck) return;

    if (!user) {
      toast.error("Алдымен кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    if (truck.driver_id !== user.id && user.role !== "admin") {
      toast.error("Бұл көлік сізге тиесілі емес");
      return;
    }

    if (!form.load_capacity || Number(form.load_capacity) <= 0) {
      toast.error("Жүк көтерімділігін дұрыс енгізіңіз");
      return;
    }

    if (!form.volume || Number(form.volume) <= 0) {
      toast.error("Көлемін дұрыс енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      await updateTruck(id, {
        current_city: form.current_city,
        destination_city: form.destination_city,
        vehicle_type: form.vehicle_type,
        load_capacity: Number(form.load_capacity),
        volume: Number(form.volume),
        ready_date: form.ready_date,
        comment: form.comment || undefined,
      });

      await qc.invalidateQueries({ queryKey: ["truck", id] });
      await qc.invalidateQueries({ queryKey: ["my-trucks"] });
      await qc.invalidateQueries({ queryKey: ["trucks"] });

      toast.success("Өзгерістер сақталды");
      navigate({ to: "/my-truck" });
    } catch (e: any) {
      toast.error(e?.message || "Сақтау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell width="narrow">
        <div style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      </AppShell>
    );
  }

  if (!truck) {
    return (
      <AppShell width="narrow">
        <div className="card">Көлік табылмады</div>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/my-truck" })}>
        ← {t("common.back")}
      </button>

      <h1 className="page-title">Көлікті өңдеу</h1>

      <div className="card" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <L label={t("truck.current")}>
          <select className="input" value={form.current_city} onChange={(e) => set({ current_city: e.target.value })}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label={t("truck.destination")}>
          <select className="input" value={form.destination_city} onChange={(e) => set({ destination_city: e.target.value })}>
            <option value="any">{t("truck.anyDirection")}</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label={t("order.vehicleType")}>
          <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>
            {VEHICLE_TYPES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </L>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <L label={t("auth.capacity")}>
            <input
  className="input"
  type="number"
  min="0"
  step="0.1"
  value={form.volume}
  onChange={(e) => {
    const value = e.target.value;

    if (Number(value) < 0) {
      set({ volume: "0" });
      return;
    }

    set({ volume: value });
  }}
/>
          </L>

          <L label={t("order.volume")}>
            <input
  className="input"
  type="number"
  min="0"
  step="0.1"
  value={form.volume}
  onChange={(e) => {
    const value = e.target.value;

    if (Number(value) < 0) {
      set({ volume: "0" });
      return;
    }

    set({ volume: value });
  }}
/>
          </L>
        </div>

        <L label={t("truck.readyDate")}>
          <input
            className="input"
            type="date"
            value={form.ready_date}
            onChange={(e) => set({ ready_date: e.target.value })}
          />
        </L>

        <L label={t("truck.comment")}>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={form.comment}
            onChange={(e) => set({ comment: e.target.value })}
          />
        </L>

        <button className="btn accent" disabled={busy} onClick={save}>
          {busy ? "Сақталуда..." : "Сақтау"}
        </button>
      </div>
    </AppShell>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="step-label active" style={{ display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}