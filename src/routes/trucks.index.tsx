import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TruckCard } from "@/components/TruckCard";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { getUser, listTrucks } from "@/lib/services";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/trucks/")({
  head: () => ({
    meta: [
      { title: "Көліктер тізімі — ARGO" },
      { name: "description", content: "Бос көліктер мен жүргізушілер. Қала, бағыт және көлік түрі бойынша іздеңіз." },
      { property: "og:title", content: "Көліктер — ARGO" },
      { property: "og:description", content: "Бос фуралар мен көліктерді табыңыз." },
    ],
  }),
  component: Trucks,
});

function Trucks() {
  const { t } = useI18n();
  const [f, setF] = useState<{ city?: string; dest?: string; vehicle_type?: string }>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["trucks", f],
    queryFn: () => listTrucks(f),
  });

  const { data: drivers = {} } = useQuery({
    queryKey: ["truck-drivers", data.map((x) => x.driver_id).join(",")],
    enabled: data.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        data.map(async (tr) => {
          const u = await getUser(tr.driver_id);
          return [tr.driver_id, u] as const;
        })
      );

      return entries.reduce<Record<string, User | undefined>>((acc, [id, u]) => {
        acc[id] = u;
        return acc;
      }, {});
    },
  });

  return (
    <AppShell>
      <div className="sec-header">
        <div>
          <h1 className="page-title">{t("nav.trucks")}</h1>
          <p className="page-sub">{data.length} көлік</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <div className="filter-grid">
          <select className="input" value={f.city ?? ""} onChange={(e) => setF({ ...f, city: e.target.value || undefined })}>
            <option value="">{t("truck.current")}</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select className="input" value={f.dest ?? ""} onChange={(e) => setF({ ...f, dest: e.target.value || undefined })}>
            <option value="">{t("truck.destination")}</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select className="input" value={f.vehicle_type ?? ""} onChange={(e) => setF({ ...f, vehicle_type: e.target.value || undefined })}>
            <option value="">{t("order.vehicleType")}</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>

          <button className="btn ghost" onClick={() => setF({})}>
            {t("common.clear") || "Тазалау"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>
          {t("common.loading")}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title={t("truck.noTrucks")} icon="truck" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {data.map((tr) => (
            <TruckCard key={tr.id} truck={tr} driver={drivers[tr.driver_id]} />
          ))}
        </div>
      )}
    </AppShell>
  );
}