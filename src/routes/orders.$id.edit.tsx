import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { getOrder, updateOrder } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/orders/$id/edit")({
  component: OrderEdit,
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

function dateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function OrderEdit() {
  const { id } = useParams({ from: "/orders/$id/edit" });
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();

  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });

  useEffect(() => {
    if (!order) return;

    setForm({
      cargo_name: order.cargo_name,
      vehicle_type: order.vehicle_type,
      weight: String(order.weight),
      volume: String(order.volume),
      from_city: order.from_city,
      from_address: order.from_address || "",
      to_city: order.to_city,
      to_address: order.to_address || "",
      loading_date: dateOnly(order.loading_date),
      price: order.price ? String(order.price) : "",
      negotiable: order.negotiable,
      comment: order.comment || "",
    });
  }, [order?.id]);

  const set = (patch: Partial<FormState>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
  };

  const save = async () => {
    if (!form || !order) return;

    if (!user) {
      toast.error("Алдымен кіріңіз");
      navigate({ to: "/auth" });
      return;
    }

    if (order.owner_id !== user.id && user.role !== "admin") {
      toast.error("Бұл жүк сізге тиесілі емес");
      return;
    }

    if (!form.cargo_name.trim()) return toast.error("Жүк атауын енгізіңіз");
    if (!form.weight || Number(form.weight) <= 0) return toast.error("Салмағын дұрыс енгізіңіз");
    if (!form.volume || Number(form.volume) <= 0) return toast.error("Көлемін дұрыс енгізіңіз");
    if (!form.loading_date) return toast.error("Тиеу күнін таңдаңыз");

    if (!form.negotiable && (!form.price || Number(form.price) <= 0)) {
      return toast.error("Бағаны енгізіңіз немесе келісімді деп белгілеңіз");
    }

    setBusy(true);

    try {
      await updateOrder(id, {
        cargo_name: form.cargo_name.trim(),
        vehicle_type: form.vehicle_type,
        weight: Number(form.weight),
        volume: Number(form.volume),
        from_city: form.from_city,
        from_address: form.from_address || undefined,
        to_city: form.to_city,
        to_address: form.to_address || undefined,
        loading_date: form.loading_date,
        price: form.negotiable ? undefined : Number(form.price),
        negotiable: form.negotiable,
        comment: form.comment || undefined,
      });

      await qc.invalidateQueries({ queryKey: ["order", id] });
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      await qc.invalidateQueries({ queryKey: ["orders"] });

      toast.success("Жүк сақталды");
      navigate({ to: "/my-cargo" });
    } catch (e: any) {
      toast.error(e?.message || "Сақтау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !form) {
    return (
      <AppShell width="narrow">
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell width="narrow">
        <div className="card">Жүк табылмады</div>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/my-cargo" })}>
        ← {t("common.back")}
      </button>

      <h1 className="page-title">Жүкті өңдеу</h1>

      <div className="card" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" value={form.cargo_name} onChange={(e) => set({ cargo_name: e.target.value })} placeholder={t("order.name")} />

        <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>
          {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
        </select>

        <input className="input" type="number" value={form.weight} onChange={(e) => set({ weight: e.target.value })} placeholder={t("order.weight")} />

        <input className="input" type="number" value={form.volume} onChange={(e) => set({ volume: e.target.value })} placeholder={t("order.volume")} />

        <select className="input" value={form.from_city} onChange={(e) => set({ from_city: e.target.value })}>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <input className="input" value={form.from_address} onChange={(e) => set({ from_address: e.target.value })} placeholder="Тиеу мекенжайы" />

        <select className="input" value={form.to_city} onChange={(e) => set({ to_city: e.target.value })}>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <input className="input" value={form.to_address} onChange={(e) => set({ to_address: e.target.value })} placeholder="Түсіру мекенжайы" />

        <input className="input" type="date" value={form.loading_date} onChange={(e) => set({ loading_date: e.target.value })} />

        <label className="chip" style={{ cursor: "pointer", gap: 6, alignSelf: "flex-start" }}>
          <input type="checkbox" checked={form.negotiable} onChange={(e) => set({ negotiable: e.target.checked })} />
          {t("order.negotiable")}
        </label>

        {!form.negotiable && (
          <input className="input" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder={t("order.price")} />
        )}

        <textarea className="input" style={{ minHeight: 90, resize: "vertical" }} value={form.comment} onChange={(e) => set({ comment: e.target.value })} placeholder={t("order.comment")} />

        <button className="btn primary" disabled={busy} onClick={save}>
          {busy ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </AppShell>
  );
}