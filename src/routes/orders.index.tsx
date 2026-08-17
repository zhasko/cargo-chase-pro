import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CargoCard } from "@/components/CargoCard";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { listOrders } from "@/lib/services";
import type { OrderFilters } from "@/lib/types";

const FILTER_STORAGE_KEY = "argo-order-filters";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Жүктер тізімі — ARGO" },
      {
        name: "description",
        content:
          "Қазақстан бойынша жүктер тізімі. Бағыт, көлік түрі және баға бойынша сүзгілеңіз.",
      },
      {
        property: "og:title",
        content: "Жүктер — ARGO",
      },
      {
        property: "og:description",
        content:
          "Жүктерді бағыт пен баға бойынша іздеңіз.",
      },
    ],
  }),

  component: Orders,
});

function Orders() {
  const { t } = useI18n();

  /*
   * =========================================================
   * FILTERS
   * =========================================================
   *
   * Бетті ашқанда бірден sessionStorage-дан аламыз.
   */

  const [filters, setFilters] = useState<OrderFilters>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const saved = sessionStorage.getItem(
        FILTER_STORAGE_KEY,
      );

      if (!saved) {
        return {};
      }

      return JSON.parse(saved) as OrderFilters;
    } catch {
      return {};
    }
  });

  const [showFilters, setShowFilters] =
    useState(false);

  /*
   * =========================================================
   * SAVE FILTERS
   * =========================================================
   *
   * Фильтр өзгерген сайын storage-қа жазылады.
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(filters),
      );
    } catch {
      // ignore
    }
  }, [filters]);

  /*
   * =========================================================
   * QUICK SEARCH
   * =========================================================
   *
   * Басқа беттен келген from/to болса,
   * оны қазіргі фильтрге қосамыз.
   *
   * Маңызды:
   * argo_qs бір рет қана оқылады.
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const qs = sessionStorage.getItem("argo_qs");

    if (!qs) {
      return;
    }

    try {
      const parsed = JSON.parse(qs) as {
        from?: string;
        to?: string;
      };

      setFilters((current) => ({
        ...current,

        from:
          parsed.from ||
          current.from ||
          undefined,

        to:
          parsed.to ||
          current.to ||
          undefined,
      }));

      setShowFilters(true);
    } catch {
      // ignore
    } finally {
      /*
       * Бір рет қолданылған quick-search-ті өшіреміз.
       * Әйтпесе Back/қайта mount кезінде қайтадан
       * ескі фильтрді үстінен жазуы мүмкін.
       */
      sessionStorage.removeItem("argo_qs");
    }
  }, []);

  /*
   * =========================================================
   * ORDERS
   * =========================================================
   */

  const {
  data = [],
  isLoading,
} = useQuery({
  queryKey: ["orders", filters],
  queryFn: () => listOrders(filters),

  // Әр 10 секунд сайын жүктерді автоматты түрде жаңартады
  refetchInterval: 10_000,

  // Браузер вкладкасы қайта ашылғанда да жаңартады
  refetchOnWindowFocus: true,
});
  /*
   * =========================================================
   * CLEAR
   * =========================================================
   */

  const handleClear = () => {
    const cleared: OrderFilters = {
      sort: "new",
      date: "all",
    };

    setFilters(cleared);

    /*
     * Бірден storage-ты да тазалаймыз.
     */
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(cleared),
      );
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      {/* HEADER */}

      <div className="sec-header">
        <div>
          <h1 className="page-title">
            {t("nav.orders")}
          </h1>

          <p className="page-sub">
            Қазақстан бойынша жүктерді бағыт, көлік түрі
            және баға бойынша іздеңіз.
          </p>
        </div>
      </div>

      {/* FILTER */}

      <div style={{ marginBottom: 22 }}>
        <FilterBar
          value={filters}
          onChange={setFilters}
          onClear={handleClear}
        />
      </div>

      {/* RESULTS */}

      {isLoading ? (
        <div
          className="text-muted"
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          {t("common.loading")}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title={t("order.noOrders")}
          description={t("order.noOrdersDesc")}
          icon="package"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {data.map((order) => (
            <CargoCard
              key={order.id}
              order={order}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}