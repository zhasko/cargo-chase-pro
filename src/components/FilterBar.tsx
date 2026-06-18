import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import type { OrderFilters } from "@/lib/types";
import { Icon } from "./icons";

export function FilterBar({
  value,
  onChange,
  onClear,
}: {
  value: OrderFilters;
  onChange: (f: OrderFilters) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const set = (patch: Partial<OrderFilters>) => onChange({ ...value, ...patch });
  const num = (v: string) => (v === "" ? undefined : Number(v));

  const dates: { k: NonNullable<OrderFilters["date"]>; label: string }[] = [
    { k: "today", label: t("common.today") },
    { k: "tomorrow", label: t("common.tomorrow") },
    { k: "week", label: t("common.thisWeek") },
    { k: "all", label: t("common.all") },
  ];

  return (
    <div className="filter-bar">
      <div className="filter-grid">
        <select className="input" value={value.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })}>
          <option value="">{t("common.from")}</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={value.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })}>
          <option value="">{t("common.to")}</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={value.vehicle_type ?? ""} onChange={(e) => set({ vehicle_type: e.target.value || undefined })}>
          <option value="">{t("order.vehicleType")}</option>
          {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
        </select>
        <input className="input" type="number" placeholder={t("filters.minWeight")} value={value.min_weight ?? ""} onChange={(e) => set({ min_weight: num(e.target.value) })} />
        <input className="input" type="number" placeholder={t("filters.maxWeight")} value={value.max_weight ?? ""} onChange={(e) => set({ max_weight: num(e.target.value) })} />
        <input className="input" type="number" placeholder={t("filters.minVolume")} value={value.min_volume ?? ""} onChange={(e) => set({ min_volume: num(e.target.value) })} />
        <input className="input" type="number" placeholder={t("filters.maxVolume")} value={value.max_volume ?? ""} onChange={(e) => set({ max_volume: num(e.target.value) })} />
        <input className="input" type="number" placeholder={t("filters.minPrice")} value={value.min_price ?? ""} onChange={(e) => set({ min_price: num(e.target.value) })} />
        <input className="input" type="number" placeholder={t("filters.maxPrice")} value={value.max_price ?? ""} onChange={(e) => set({ max_price: num(e.target.value) })} />
        <select className="input" value={value.sort ?? "new"} onChange={(e) => set({ sort: e.target.value as OrderFilters["sort"] })}>
          <option value="new">{t("filters.sortNew")}</option>
          <option value="price_high">{t("filters.sortPriceHigh")}</option>
          <option value="price_low">{t("filters.sortPriceLow")}</option>
          <option value="weight">{t("filters.sortWeight")}</option>
          <option value="volume">{t("filters.sortVolume")}</option>
        </select>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
        {dates.map((d) => (
          <button key={d.k} className={`tab${value.date === d.k ? " active" : ""}`} onClick={() => set({ date: d.k })}>
            {d.label}
          </button>
        ))}
        <label className="chip" style={{ cursor: "pointer", gap: 6 }}>
          <input type="checkbox" checked={!!value.negotiable} onChange={(e) => set({ negotiable: e.target.checked || undefined })} />
          {t("order.negotiable")}
        </label>
        <button className="btn ghost" style={{ marginLeft: "auto", padding: "6px 14px" }} onClick={onClear}>
          <Icon.x style={{ width: 14, height: 14 }} /> {t("common.clear")}
        </button>
      </div>
    </div>
  );
}
