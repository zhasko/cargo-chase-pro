import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { createTruck, isSubscriptionActive } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/trucks/new")({
  component: TruckNew,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function TruckNew() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    current_city: CITIES[0],
    destination_city: "any",
    vehicle_type: VEHICLE_TYPES[0],
    load_capacity: "" as number | "",
    volume: "" as number | "",
    ready_date: todayISO(),
    contact_phone: user?.phone || "",
    comment: "",
  });

  const set = (p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
  };

  const submit = async () => {
    if (!user) {
      toast.error("Көлік жариялау үшін алдымен кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    if (user.role !== "driver") {
      toast.error("Көлік жариялау үшін жүргізуші режиміне өтіңіз");
      navigate({ to: "/profile" });
      return;
    }

    if (!isSubscriptionActive(user.id)) {
      toast.error("Көлік жариялау үшін жазылым қажет");
      navigate({ to: "/pricing" });
      return;
    }

    if (!form.current_city) return toast.error("Жүк алатын қаланы таңдаңыз");
    if (!form.destination_city) return toast.error("Бағытты таңдаңыз");
    if (!form.vehicle_type) return toast.error("Көлік түрін таңдаңыз");

    if (form.load_capacity === "" || Number(form.load_capacity) <= 0) {
      toast.error("Жүк көтерімділігін дұрыс енгізіңіз");
      return;
    }

    if (form.volume === "" || Number(form.volume) <= 0) {
      toast.error("Көлемін дұрыс енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      const truck = await createTruck(
        {
          current_city: form.current_city,
          destination_city: form.destination_city,
          vehicle_type: form.vehicle_type,
          load_capacity: Number(form.load_capacity),
          volume: Number(form.volume),
          ready_date: form.ready_date,
          contact_phone: form.contact_phone.trim() || user.phone,
          comment: form.comment.trim() || undefined,
        },
        user.id
      );

      toast.success(t("truck.publishSuccess"));
      navigate({ to: "/trucks/$id", params: { id: truck.id } });
    } catch (e: any) {
      toast.error(e?.message || "Көлік жариялау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/" })}>
        ← {t("common.back")}
      </button>

      <h1 className="page-title">{t("truck.publishTitle")}</h1>
      <p className="page-sub">Көлігіңіз қай қаладан жүк алуға дайын екенін көрсетіңіз</p>

      <div className="card" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <L label="Жүк алатын қала">
          <select
            className="input"
            value={form.current_city}
            onChange={(e) => set({ current_city: e.target.value })}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label={t("truck.destination")}>
          <select
            className="input"
            value={form.destination_city}
            onChange={(e) => set({ destination_city: e.target.value })}
          >
            <option value="any">{t("truck.anyDirection")}</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label={t("order.vehicleType")}>
          <select
            className="input"
            value={form.vehicle_type}
            onChange={(e) => set({ vehicle_type: e.target.value })}
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </L>

        <L label={t("auth.capacity")}>
          <input
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={form.load_capacity}
            onChange={(e) => {
              const value = e.target.value;
              set({ load_capacity: value === "" ? "" : Math.max(0, Number(value)) });
            }}
            placeholder="20"
          />
        </L>

        <L label={t("order.volume")}>
          <input
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={form.volume}
            onChange={(e) => {
              const value = e.target.value;
              set({ volume: value === "" ? "" : Math.max(0, Number(value)) });
            }}
            placeholder="86"
          />
        </L>

        <L label={t("truck.readyDate")}>
          <input
            className="input"
            type="date"
            value={form.ready_date}
            onChange={(e) => set({ ready_date: e.target.value })}
          />
        </L>

        <L label="Байланыс нөмірі">
          <input
            className="input"
            value={form.contact_phone}
            onChange={(e) => set({ contact_phone: e.target.value })}
            placeholder={user?.phone || "+7 777 123 45 67"}
          />
        </L>

        <L label={t("truck.comment")}>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={form.comment}
            onChange={(e) => set({ comment: e.target.value })}
            placeholder="Бүгін босмын, жеңіл жүк аламын..."
          />
        </L>

        <button className="btn accent" disabled={busy} onClick={submit}>
          {busy ? t("common.loading") : t("common.publish")}
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