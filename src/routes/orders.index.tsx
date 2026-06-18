import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CargoCard } from "@/components/CargoCard";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { listOrders } from "@/lib/services";
import type { OrderFilters } from "@/lib/types";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Жүктер тізімі — ARGO" },
      { name: "description", content: "Қазақстан бойынша жүктер тізімі. Бағыт, көлік түрі және баға бойынша сүзгілеңіз." },
      { property: "og:title", content: "Жүктер — ARGO" },
      { property: "og:description", content: "Жүктерді бағыт пен баға бойынша іздеңіз." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { t } = useI18n();
  const [filters, setFilters] = useState<OrderFilters>({ sort: "new", date: "all" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const qs = sessionStorage.getItem("argo_qs");
    if (qs) {
      try {
        const { from, to } = JSON.parse(qs);
        setFilters((f) => ({ ...f, from: from || undefined, to: to || undefined }));
        setShowFilters(true);
      } catch { /* ignore */ }
      sessionStorage.removeItem("argo_qs");
    }
  }, []);

  const { data, isLoading } = useQuery({ queryKey: ["orders", filters], queryFn: () => listOrders(filters) });

  return (
    <AppShell>
      <div className="sec-header">
        <div>
          <h1 className="page-title">{t("nav.orders")}</h1>
          <p className="page-sub">{(data?.length ?? 0)} {t("common.all").toLowerCase()}</p>
        </div>
        <button className="btn ghost" onClick={() => setShowFilters((s) => !s)}>
          <Icon.filter style={{ width: 16, height: 16 }} /> {t("common.filter")}
        </button>
      </div>

      {showFilters && (
        <div style={{ marginBottom: 18 }}>
          <FilterBar value={filters} onChange={setFilters} onClear={() => setFilters({ sort: "new", date: "all" })} />
        </div>
      )}

      {isLoading ? (
        <div className="text-muted" style={{ padding: 40, textAlign: "center" }}>{t("common.loading")}</div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title={t("order.noOrders")} description={t("order.noOrdersDesc")} icon="package" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {data!.map((o) => <CargoCard key={o.id} order={o} />)}
        </div>
      )}
    </AppShell>
  );
}
