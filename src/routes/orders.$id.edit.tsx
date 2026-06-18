import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import { getOrder, updateOrder } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/orders/$id/edit")({
  head: () => ({ meta: [{ title: "Жүкті өңдеу — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: OrderEdit,
});

function OrderEdit() {
  const { id } = useParams({ from: "/orders/$id/edit" });
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);

  const { data: order } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });
  const [form, setForm] = useState<{ cargo_name: string; vehicle_type: string; weight: string; volume: string; from_city: string; to_city: string; price: string; negotiable: boolean; comment: string } | null>(null);

  useEffect(() => {
    if (order && !form) {
      setForm({
        cargo_name: order.cargo_name, vehicle_type: order.vehicle_type,
        weight: String(order.weight), volume: String(order.volume),
        from_city: order.from_city, to_city: order.to_city,
        price: order.price ? String(order.price) : "", negotiable: order.negotiable, comment: order.comment ?? "",
      });
    }
  }, [order, form]);

  if (!form) return <AppShell width="narrow"><div className="text-muted" style={{ padding: 40, textAlign: "center" }}>{t("common.loading")}</div></AppShell>;
  const set = (p: Partial<typeof form>) => setForm({ ...form, ...p });

  const save = async () => {
    if (!form.cargo_name.trim()) { toast.error(t("common.required")); return; }
    await updateOrder(id, {
      cargo_name: form.cargo_name, vehicle_type: form.vehicle_type,
      weight: Number(form.weight), volume: Number(form.volume),
      from_city: form.from_city, to_city: form.to_city,
      price: form.negotiable ? undefined : Number(form.price), negotiable: form.negotiable, comment: form.comment || undefined,
    });
    toast.success(t("common.success"));
    navigate({ to: "/my-cargo" });
  };

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/my-cargo" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("common.edit")}</h1>
      <div className="card" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="input" value={form.cargo_name} onChange={(e) => set({ cargo_name: e.target.value })} placeholder={t("order.name")} />
        <select className="input" value={form.vehicle_type} onChange={(e) => set({ vehicle_type: e.target.value })}>{VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}</select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input className="input" type="number" value={form.weight} onChange={(e) => set({ weight: e.target.value })} placeholder={t("order.weight")} />
          <input className="input" type="number" value={form.volume} onChange={(e) => set({ volume: e.target.value })} placeholder={t("order.volume")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select className="input" value={form.from_city} onChange={(e) => set({ from_city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input" value={form.to_city} onChange={(e) => set({ to_city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <label className="chip" style={{ cursor: "pointer", gap: 6, alignSelf: "flex-start" }}>
          <input type="checkbox" checked={form.negotiable} onChange={(e) => set({ negotiable: e.target.checked })} /> {t("order.negotiable")}
        </label>
        {!form.negotiable && <input className="input" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder={t("order.price")} />}
        <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} value={form.comment} onChange={(e) => set({ comment: e.target.value })} placeholder={t("order.comment")} />
        <button className="btn primary" onClick={save}>{t("common.save")}</button>
      </div>
    </AppShell>
  );
}
