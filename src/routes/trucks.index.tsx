import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TruckCard } from "@/components/TruckCard";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { listTrucks } from "@/lib/services";
import { MOCK_USERS, CITIES, VEHICLE_TYPES } from "@/lib/mock-data";

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
  const { data, isLoading } = useQuery({ queryKey: ["trucks", f], queryFn: () => listTrucks(f) });

  return (
    <AppShell>
      <div className="sec-header">
        <h1 className="page-title">{t("nav.trucks")}</h1>
      </div>
      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <div className="filter-grid">
          <select className="input" value={f.city ?? ""} onChange={(e) => setF({ ...f, city: e.target.value || undefined })}>
            <option value="">{t("truck.current")}</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={f.dest ?? ""} onChange={(e) => setF({ ...f, dest: e.target.value || undefined })}>
            <option value="">{t("truck.destination")}</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" value={f.vehicle_type ?? ""} onChange={(e) => setF({ ...f, vehicle_type: e.target.value || undefined })}>
            <option value="">{t("order.vehicleType")}</option>
            {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>{t("common.loading")}</div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title={t("truck.noTrucks")} icon="truck" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {data!.map((tr) => <TruckCard key={tr.id} truck={tr} driver={MOCK_USERS.find((u) => u.id === tr.driver_id)} />)}
        </div>
      )}
    </AppShell>
  );
}
