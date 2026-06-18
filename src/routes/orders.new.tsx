import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { kzt, shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { createOrder, countTodayOrders } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "Жүк қосу — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: OrderNew,
});

interface FormState {
  cargo_name: string;
  vehicle_type: string;
  weight: string;
  volume: string;
  from_city: string;
  from_address: string;
  to_city: string;
  to_address: string;
  loading_date: string;
  price: string;
  negotiable: boolean;
  comment: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function OrderNew() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    cargo_name: "", vehicle_type: VEHICLE_TYPES[0], weight: "", volume: "",
    from_city: CITIES[0], from_address: "", to_city: CITIES[1], to_address: "",
    loading_date: todayISO(), price: "", negotiable: false, comment: "",
  });

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const steps = [t("order.stepCargo"), t("order.stepRoute"), t("order.stepPrice"), t("order.stepPreview")];

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.cargo_name.trim()) e.cargo_name = t("common.required");
      if (!form.weight || Number(form.weight) <= 0) e.weight = t("common.required");
    }
    if (s === 1) {
      if (!form.from_city) e.from_city = t("common.required");
      if (!form.to_city) e.to_city = t("common.required");
    }
    if (s === 2) {
      if (!form.negotiable && (!form.price || Number(form.price) <= 0)) e.price = t("common.required");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep((s) => Math.min(s + 1, 3)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const count = await countTodayOrders(user.id);
    if (count >= 10) {
      setBusy(false);
      toast.error(t("order.limitReached"));
      return;
    }
    const order = await createOrder({
      cargo_name: form.cargo_name,
      vehicle_type: form.vehicle_type,
      weight: Number(form.weight),
      volume: Number(form.volume) || 0,
      from_city: form.from_city,
      from_address: form.from_address,
      to_city: form.to_city,
      to_address: form.to_address,
      loading_date: new Date(form.loading_date).toISOString(),
      price: form.price ? Number(form.price) : undefined,
      negotiable: form.negotiable,
      comment: form.comment || undefined,
    }, user.id);
    setBusy(false);
    toast.success(t("order.publishSuccess"));
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("nav.addCargo")}</h1>

      <div className="steps-bar">
        {steps.map((label, i) => (
          <div className="step-bar" key={i}>
            <div className={`step-progress${i <= step ? " done" : ""}`} />
            <div className={`step-label${i === step ? " active" : ""}`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={t("order.name")} error={errors.cargo_name}>
              <input className="input" value={form.cargo_name} onChange={(e) => set({ cargo_name: e.target.value })} />
            </Field>
            <Field label={t("order.vehicleType")}>
              <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>
                {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label={t("order.weight")} error={errors.weight}>
                <input className="input" type="number" value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
              </Field>
              <Field label={t("order.volume")}>
                <input className="input" type="number" value={form.volume} onChange={(e) => set({ volume: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={t("order.fromCity")} error={errors.from_city}>
              <select className="input" value={form.from_city} onChange={(e) => set({ from_city: e.target.value })}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={t("order.fromAddress")}>
              <input className="input" value={form.from_address} onChange={(e) => set({ from_address: e.target.value })} />
            </Field>
            <Field label={t("order.toCity")} error={errors.to_city}>
              <select className="input" value={form.to_city} onChange={(e) => set({ to_city: e.target.value })}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={t("order.toAddress")}>
              <input className="input" value={form.to_address} onChange={(e) => set({ to_address: e.target.value })} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={t("order.loadingDate")}>
              <input className="input" type="date" value={form.loading_date} onChange={(e) => set({ loading_date: e.target.value })} />
            </Field>
            <label className="chip" style={{ cursor: "pointer", gap: 6, alignSelf: "flex-start" }}>
              <input type="checkbox" checked={form.negotiable} onChange={(e) => set({ negotiable: e.target.checked })} />
              {t("order.negotiable")}
            </label>
            {!form.negotiable && (
              <Field label={t("order.price")} error={errors.price}>
                <input className="input" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} />
              </Field>
            )}
            <Field label={t("order.comment")}>
              <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} value={form.comment} onChange={(e) => set({ comment: e.target.value })} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="cargo-card-route" style={{ fontSize: 18 }}>
              <span>{form.from_city}</span><Icon.arrow style={{ width: 16, height: 16 }} /><span>{form.to_city}</span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{form.cargo_name}</div>
            <div className="cargo-chips" style={{ marginTop: 12 }}>
              <span className="chip accent">{form.vehicle_type}</span>
              <span className="chip">{form.weight} т</span>
              {form.volume && <span className="chip">{form.volume} м³</span>}
              <span className="chip">{shortDate(new Date(form.loading_date).toISOString())}</span>
            </div>
            <div className="order-price-box">
              <label>{t("order.price")}</label>
              <div className="order-price-val">{form.negotiable ? t("order.negotiable") : kzt(Number(form.price))}</div>
            </div>
            {form.comment && <p className="text-muted" style={{ fontSize: 13, marginTop: 12 }}>{form.comment}</p>}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {step > 0 && <button className="btn ghost" style={{ flex: 1 }} onClick={prev}>{t("common.back")}</button>}
          {step < 3 ? (
            <button className="btn primary" style={{ flex: 2 }} onClick={next}>{t("common.next")}</button>
          ) : (
            <button className="btn accent" style={{ flex: 2 }} disabled={busy} onClick={submit}>{t("common.publish")}</button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="step-label active" style={{ display: "block", marginBottom: 6 }}>{label}</label>
      {children}
      {error && <div className="text-danger" style={{ fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
