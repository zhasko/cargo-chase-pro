import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { createOrder, countTodayOrders } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "Жүк қосу — ARGO" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderNew,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function OrderNew() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    cargo_name: "",
    vehicle_type: VEHICLE_TYPES[0],
    weight: "" as number | "",
    volume: "" as number | "",
    from_city: CITIES[0],
    from_address: "",
    to_city: CITIES[1],
    to_address: "",
    loading_date: todayISO(),
    price: "" as number | "",
    negotiable: false,
    contact_phone: user?.phone || "",
    comment: "",
  });

  const set = (p: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...p }));
  };

  const submit = async () => {
    if (!user) {
      toast.error("Жүк жариялау үшін алдымен кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    if (!form.cargo_name.trim()) {
      toast.error("Жүк атауын енгізіңіз");
      return;
    }

    if (!form.vehicle_type) {
      toast.error("Көлік түрін таңдаңыз");
      return;
    }

    if (form.weight === "" || Number(form.weight) <= 0) {
      toast.error("Салмақты дұрыс енгізіңіз");
      return;
    }

    if (form.volume === "" || Number(form.volume) <= 0) {
      toast.error("Көлемді дұрыс енгізіңіз");
      return;
    }

    if (!form.from_city) {
      toast.error("Тиеу қаласын таңдаңыз");
      return;
    }

    if (!form.to_city) {
      toast.error("Түсіру қаласын таңдаңыз");
      return;
    }

    if (!form.loading_date) {
      toast.error("Тиеу күнін таңдаңыз");
      return;
    }

    if (!form.negotiable && (form.price === "" || Number(form.price) <= 0)) {
      toast.error("Бағаны енгізіңіз немесе келісімді деп белгілеңіз");
      return;
    }

    setBusy(true);

    try {
      const count = await countTodayOrders(user.id);

      if (count >= 10) {
        toast.error(t("order.limitReached"));
        return;
      }

      const order = await createOrder(
        {
          cargo_name: form.cargo_name.trim(),
          vehicle_type: form.vehicle_type,
          weight: Number(form.weight),
          volume: Number(form.volume),
          from_city: form.from_city,
          from_address: form.from_address.trim() || undefined,
          to_city: form.to_city,
          to_address: form.to_address.trim() || undefined,
          loading_date: form.loading_date,
          price: form.negotiable ? undefined : Number(form.price),
          negotiable: form.negotiable,
          contact_phone: form.contact_phone.trim() || user.phone,
          comment: form.comment.trim() || undefined,
        },
        user.id
      );

      toast.success(t("order.publishSuccess"));
      navigate({ to: "/orders/$id", params: { id: order.id } });
    } catch (e: any) {
      toast.error(e?.message || "Жүк жариялау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/" })}>
        ← {t("common.back")}
      </button>

      <h1 className="page-title">{t("nav.addCargo")}</h1>
      <p className="page-sub">Жүк туралы ақпаратты толтырыңыз</p>

      <div
        className="card"
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <L label="Жүк атауы">
          <input
            className="input"
            value={form.cargo_name}
            onChange={(e) => set({ cargo_name: e.target.value })}
            placeholder="Мысалы: құрылыс материалы, жиһаз, техника"
          />
        </L>

        <L label="Көлік түрі">
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <L label="Салмақ, т">
            <input
              className="input"
              type="number"
              min={0}
              step={0.1}
              value={form.weight}
              onChange={(e) => {
                const value = e.target.value;
                set({ weight: value === "" ? "" : Math.max(0, Number(value)) });
              }}
              placeholder="20"
            />
          </L>

          <L label="Көлем, м³">
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
        </div>

        <L label="Тиеу қаласы">
          <select
            className="input"
            value={form.from_city}
            onChange={(e) => set({ from_city: e.target.value })}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label="Тиеу мекенжайы">
          <input
            className="input"
            value={form.from_address}
            onChange={(e) => set({ from_address: e.target.value })}
            placeholder="Аудан, көше, үй нөмірі (міндетті емес)"
          />
        </L>

        <L label="Түсіру қаласы">
          <select
            className="input"
            value={form.to_city}
            onChange={(e) => set({ to_city: e.target.value })}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </L>

        <L label="Түсіру мекенжайы">
          <input
            className="input"
            value={form.to_address}
            onChange={(e) => set({ to_address: e.target.value })}
            placeholder="Аудан, көше, үй нөмірі (міндетті емес)"
          />
        </L>

        <L label="Тиеу күні">
          <input
            className="input"
            type="date"
            value={form.loading_date}
            onChange={(e) => set({ loading_date: e.target.value })}
          />
        </L>

        <label className="chip" style={{ cursor: "pointer", gap: 6, alignSelf: "flex-start" }}>
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => set({ negotiable: e.target.checked })}
          />
          Баға келісімді
        </label>

        {!form.negotiable && (
          <L label="Баға, ₸">
            <input
              className="input"
              type="number"
              min={0}
              step={1000}
              value={form.price}
              onChange={(e) => {
                const value = e.target.value;
                set({ price: value === "" ? "" : Math.max(0, Number(value)) });
              }}
              placeholder="250000"
            />
          </L>
        )}

        <L label="Байланыс нөмірі">
          <input
            className="input"
            value={form.contact_phone}
            onChange={(e) => set({ contact_phone: e.target.value })}
            placeholder={user?.phone || "+7 777 123 45 67"}
          />
        </L>

        <L label="Қосымша ақпарат">
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={form.comment}
            onChange={(e) => set({ comment: e.target.value })}
            placeholder="Мысалы: тиеу кранмен, төлем қолма-қол, тез жеткізу керек..."
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