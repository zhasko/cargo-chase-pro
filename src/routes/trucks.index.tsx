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
      {
        name: "description",
        content:
          "Бос көліктер мен жүргізушілер. Қала, бағыт және көлік түрі бойынша іздеңіз.",
      },
      { property: "og:title", content: "Көліктер — ARGO" },
      {
        property: "og:description",
        content: "Бос фуралар мен көліктерді табыңыз.",
      },
    ],
  }),
  component: Trucks,
});

type TruckFilters = {
  city?: string;
  dest?: string;
  vehicle_type?: string;
};

function Trucks() {
  const { t } = useI18n();

  const [f, setF] = useState<TruckFilters>({});

  const setFilter = (patch: Partial<TruckFilters>) => {
    setF((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const clearFilters = () => {
    setF({});
  };

  const hasFilters =
    Boolean(f.city) ||
    Boolean(f.dest) ||
    Boolean(f.vehicle_type);

  const { data = [], isLoading } = useQuery({
  queryKey: ["trucks", f],
  queryFn: () => listTrucks(f),
  refetchInterval: 10_000,
  refetchOnWindowFocus: true,
  });

  const { data: drivers = {} } = useQuery({
    queryKey: [
      "truck-drivers",
      data.map((x) => x.driver_id).join(","),
    ],
    enabled: data.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        data.map(async (tr) => {
          const u = await getUser(tr.driver_id);

          return [tr.driver_id, u] as const;
        }),
      );

      return entries.reduce<
        Record<string, User | undefined>
      >((acc, [id, u]) => {
        acc[id] = u ?? undefined;
        return acc;
      }, {});
    },
  });

  return (
    <AppShell>
      <div className="trucks-page">

        {/* ============================================
            HEADER
        ============================================ */}

        <div className="sec-header">
          <div>
            <h1 className="page-title">
              {t("nav.trucks")}
            </h1>

            <p className="page-sub">
              {data.length} көлік
            </p>
          </div>
        </div>

        {/* ============================================
            FILTER
        ============================================ */}

        <div className="argo-truck-filter">

          <div className="argo-truck-filter-grid">

            {/* CURRENT CITY */}

            <div className="argo-truck-field">
              <label>
                {t("truck.current")}
              </label>

              <select
                value={f.city ?? ""}
                onChange={(e) =>
                  setFilter({
                    city:
                      e.target.value ||
                      undefined,
                  })
                }
              >
                <option value="">
                  Кез-келген қала
                </option>

                {CITIES.map((city) => (
                  <option
                    key={city}
                    value={city}
                  >
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* DESTINATION */}

            <div className="argo-truck-field">
              <label>
                {t("truck.destination")}
              </label>

              <select
                value={f.dest ?? ""}
                onChange={(e) =>
                  setFilter({
                    dest:
                      e.target.value ||
                      undefined,
                  })
                }
              >
                <option value="">
                  Кез-келген қала
                </option>

                {CITIES.map((city) => (
                  <option
                    key={city}
                    value={city}
                  >
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* VEHICLE */}

            <div className="argo-truck-field">
              <label>
                {t("order.vehicleType")}
              </label>

              <select
                value={
                  f.vehicle_type ?? ""
                }
                onChange={(e) =>
                  setFilter({
                    vehicle_type:
                      e.target.value ||
                      undefined,
                  })
                }
              >
                <option value="">
                  Кез-келген көлік
                </option>

                {VEHICLE_TYPES.map(
                  (vehicle) => (
                    <option
                      key={vehicle}
                      value={vehicle}
                    >
                      {vehicle}
                    </option>
                  ),
                )}
              </select>
            </div>

          </div>

          {/* ==========================================
              FILTER BOTTOM
          =========================================== */}

          <div className="argo-truck-filter-bottom">

            <div className="argo-truck-filter-status">
              {hasFilters ? (
                <>
                  <span className="argo-filter-dot" />
                  Фильтр қолданылды
                </>
              ) : (
                "Барлық көліктер"
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                className="argo-truck-clear"
                onClick={clearFilters}
              >
                Тазалау
              </button>
            )}

          </div>
        </div>

        {/* ============================================
            CONTENT
        ============================================ */}

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
            title={t("truck.noTrucks")}
            icon="truck"
          />
        ) : (
          <div
            className="argo-truck-grid"
          >
            {data.map((tr) => (
              <TruckCard
                key={tr.id}
                truck={tr}
                driver={
                  drivers[tr.driver_id]
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          STYLES
      ============================================ */}

      <style>{`

        /* ==========================================
           FILTER CONTAINER
        ========================================== */

        .argo-truck-filter {
          width: 100%;
          box-sizing: border-box;

          margin-bottom: 18px;

          padding: 16px;

          background: #1a1c28;

          border:
            1px solid
            rgba(255,255,255,.055);

          border-radius: 18px;

          box-shadow:
            0 14px 34px
            rgba(0,0,0,.12);

          color: #fff;
        }


        /* ==========================================
           GRID
        ========================================== */

        .argo-truck-filter-grid {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 10px;
        }


        /* ==========================================
           FIELD
        ========================================== */

        .argo-truck-field {
          min-width: 0;
        }

        .argo-truck-field label {
          display: block;

          margin-bottom: 7px;

          color:
            rgba(255,255,255,.45);

          font-size: 10px;

          font-weight: 700;

          letter-spacing: .07em;

          text-transform: uppercase;
        }


        /* ==========================================
           SELECT
        ========================================== */

        .argo-truck-field select {
          display: block;

          width: 100%;

          height: 42px;

          box-sizing: border-box;

          padding:
            0 12px;

          border:
            1px solid
            rgba(255,255,255,.075);

          border-radius: 9px;

          outline: none;

          background:
            rgba(255,255,255,.045);

          color: #fff;

          font-size: 13px;

          font-weight: 500;

          cursor: pointer;

          transition:
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .argo-truck-field select:hover {
          background:
            rgba(255,255,255,.055);
        }

        .argo-truck-field select:focus {
          border-color:
            rgba(192,224,64,.38);

          background:
            rgba(255,255,255,.06);

          box-shadow:
            0 0 0 2px
            rgba(192,224,64,.05);
        }

        .argo-truck-field select option {
          background: #1a1c28;

          color: #fff;
        }


        /* ==========================================
           FILTER BOTTOM
        ========================================== */

        .argo-truck-filter-bottom {
          display: flex;

          align-items: center;

          justify-content: space-between;

          min-height: 30px;

          margin-top: 8px;

          padding-top: 7px;
        }


        /* ==========================================
           STATUS
        ========================================== */

        .argo-truck-filter-status {
          display: flex;

          align-items: center;

          gap: 7px;

          color:
            rgba(255,255,255,.34);

          font-size: 10px;

          font-weight: 600;
        }

        .argo-filter-dot {
          width: 5px;

          height: 5px;

          border-radius: 50%;

          background: #c0e040;

          box-shadow:
            0 0 7px
            rgba(192,224,64,.5);
        }


        /* ==========================================
           CLEAR
        ========================================== */

        .argo-truck-clear {
          border: 0;

          background: transparent;

          color:
            rgba(255,255,255,.36);

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;

          padding: 5px 0;

          transition:
            color .18s ease;
        }

        .argo-truck-clear:hover {
          color: #c0e040;
        }


        /* ==========================================
           TRUCK GRID
        ========================================== */

        .argo-truck-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fill,
              minmax(280px, 1fr)
            );

          gap: 14px;
        }


        /* ==========================================
           TABLET
        ========================================== */

        @media (max-width: 800px) {

          .argo-truck-filter-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }


        /* ==========================================
           MOBILE
        ========================================== */

        @media (max-width: 520px) {

          .argo-truck-filter {
            padding: 14px;

            border-radius: 15px;
          }

          .argo-truck-filter-grid {
            grid-template-columns: 1fr;

            gap: 9px;
          }

          .argo-truck-field select {
            height: 40px;

            font-size: 13px;
          }

          .argo-truck-filter-bottom {
            margin-top: 7px;
          }

        }


        /* ==========================================
           SMALL PHONE
        ========================================== */

        @media (max-width: 360px) {

          .argo-truck-filter {
            padding: 12px;
          }

          .argo-truck-field select {
            font-size: 12px;
          }

          .argo-truck-filter-status {
            font-size: 9px;
          }

          .argo-truck-clear {
            font-size: 10px;
          }

        }

      `}</style>
    </AppShell>
  );
}