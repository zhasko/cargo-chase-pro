import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/icons";
import { kzt, maskPhones, shortDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { listMyOrders, setOrderStatus } from "@/lib/services";
import { useAuth } from "@/lib/store";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/my-cargo")({
  component: MyCargo,
});

function MyCargo() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth" });
    }
  }, [ready, user, navigate]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => listMyOrders(user!.id),
    enabled: !!user,
  });

  const active = data.filter((order) => order.status === "active");
  const archived = data.filter((order) => order.status === "archived");

  const changeStatus = async (
    id: string,
    status: "active" | "accepted" | "archived" | "deleted",
    message: string
  ) => {
    try {
      await setOrderStatus(id, status);

      await qc.invalidateQueries({
        queryKey: ["my-orders"],
      });

      await qc.invalidateQueries({
        queryKey: ["orders"],
      });

      await qc.invalidateQueries({
        queryKey: ["order", id],
      });

      toast.success(message);
    } catch (e: any) {
      toast.error(e?.message || "Қате шықты");
    }
  };

  if (!user) return null;

  return (
    <AppShell width="medium">
      {/* BACK */}
      <button
        className="back-btn"
        onClick={() => navigate({ to: "/profile" })}
      >
        ← {t("common.back")}
      </button>

      {/* HEADER */}
      <div className="sec-header">
        <div>
          <h1 className="page-title">Менің жүктерім</h1>

          <p className="page-sub">
            {data.length} жарияланым
          </p>
        </div>

        <button
          className="btn primary"
          onClick={() => navigate({ to: "/orders/new" })}
        >
          <Icon.plus
            style={{
              width: 16,
              height: 16,
            }}
          />

          Жүк қосу
        </button>
      </div>

      {/* CONTENT */}
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
          title="Жүк жоқ"
          description="Бірінші жүгіңізді жариялаңыз"
          icon="package"
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* ACTIVE */}
          <section>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              Белсенді
            </h2>

            {active.length === 0 ? (
              <div
                className="card text-muted"
                style={{
                  fontSize: 13,
                }}
              >
                Белсенді жүк жоқ
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {active.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    archived={false}
                    onView={() =>
                      navigate({
                        to: "/orders/$id",
                        params: {
                          id: order.id,
                        },
                      })
                    }
                    onArchive={() =>
                      changeStatus(
                        order.id,
                        "archived",
                        "Архивке жіберілді"
                      )
                    }
                    onDelete={() => {
                      if (confirm("Жүкті жоюды растайсыз ба?")) {
                        changeStatus(
                          order.id,
                          "deleted",
                          "Жүк жойылды"
                        );
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ARCHIVE */}
          <section>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              Архив
            </h2>

            {archived.length === 0 ? (
              <div
                className="card text-muted"
                style={{
                  fontSize: 13,
                }}
              >
                Архивте жүк жоқ
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {archived.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    archived
                    onView={() =>
                      navigate({
                        to: "/orders/$id",
                        params: {
                          id: order.id,
                        },
                      })
                    }
                    onRestore={() =>
                      changeStatus(
                        order.id,
                        "active",
                        "Қайта қосылды"
                      )
                    }
                    onDelete={() => {
                      if (confirm("Жүкті жоюды растайсыз ба?")) {
                        changeStatus(
                          order.id,
                          "deleted",
                          "Жүк жойылды"
                        );
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function OrderRow({
  order,
  archived,
  onView,
  onArchive,
  onRestore,
  onDelete,
}: {
  order: Order;
  archived?: boolean;
  onView: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card">
      {/* ROUTE */}
      <div
        className="cargo-card-route"
        style={{
          fontSize: 16,
        }}
      >
        <span>{order.from_city}</span>

        <Icon.arrow
          style={{
            width: 14,
            height: 14,
          }}
        />

        <span>{order.to_city}</span>
      </div>

      {/* CARGO NAME */}
      <div className="cargo-card-name">
        {order.cargo_name}
      </div>

      {/* INFO */}
      <div className="cargo-chips">
        <span className="chip accent">
          {order.vehicle_type}
        </span>

        <span className="chip">
          {order.weight} т
        </span>

        <span className="chip">
          {order.volume} м³
        </span>

        <span className="chip">
          {shortDate(order.loading_date)}
        </span>

        <span
          className={
            order.status === "active"
              ? "chip success"
              : "chip warning"
          }
        >
          {order.status === "active"
            ? "Белсенді"
            : "Архив"}
        </span>
      </div>

      {/* PRICE */}
      <div className="order-price-box">
        <label>Баға</label>

        <div className="order-price-val">
          {order.negotiable
            ? "Келісімді"
            : kzt(order.price || 0)}
        </div>
      </div>

      {/* COMMENT */}
      {order.comment && (
        <p
          className="text-muted"
          style={{
            fontSize: 13,
            marginTop: 8,
          }}
        >
          {maskPhones(order.comment || "")}
        </p>
      )}

      {/* STATISTICS */}
      <div className="cargo-chips">
        <span className="chip">
          <Icon.eye
            style={{
              width: 11,
              height: 11,
            }}
          />

          {order.views || 0}
        </span>

        <span className="chip">
          <Icon.phone
            style={{
              width: 11,
              height: 11,
            }}
          />

          {order.phone_views || 0}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="cargo-actions">
        {/* VIEW */}
        <button
          className="btn ghost"
          onClick={onView}
        >
          <Icon.eye
            style={{
              width: 14,
              height: 14,
            }}
          />

          Қарау
        </button>

        {/* ARCHIVE / RESTORE */}
        {archived ? (
          <button
            className="btn accent"
            onClick={onRestore}
          >
            <Icon.rotate
              style={{
                width: 14,
                height: 14,
              }}
            />

            Қайта қосу
          </button>
        ) : (
          <button
            className="btn ghost"
            onClick={onArchive}
          >
            <Icon.archive
              style={{
                width: 14,
                height: 14,
              }}
            />

            Архив
          </button>
        )}

        {/* DELETE */}
        <button
          className="btn danger"
          onClick={onDelete}
        >
          <Icon.trash
            style={{
              width: 14,
              height: 14,
            }}
          />
        </button>
      </div>
    </div>
  );
}