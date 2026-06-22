import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icons";
import { kzt, shortDate } from "@/lib/format";
import {
  adminStats,
  cancelSubscription,
  deleteAdminOrder,
  deleteUserAccount,
  getSubscription,
  giveSubscription,
  listAdminComplaints,
  listAdminLogs,
  listAdminOrders,
  listAdminPayments,
  listUsers,
  setUserBlocked,
  updateComplaintStatus,
} from "@/lib/services";
import { useAuth } from "@/lib/store";
import type { Order, Subscription, User } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ARGO" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Tab = "dashboard" | "users" | "drivers" | "orders" | "complaints" | "payments" | "logs";
type Range = "day" | "week" | "14days" | "year";

type UserWithSub = User & {
  subscription?: Subscription;
};

type AdminOrder = Order & {
  owner?: User;
};

function isSubActive(sub?: Subscription) {
  if (!sub) return false;

  return sub.status === "active" && new Date(sub.expires_at).getTime() > Date.now();
}

function daysLeft(sub?: Subscription) {
  if (!sub) return 0;

  const diff = new Date(sub.expires_at).getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getRangeStart(range: Range) {
  const d = new Date();

  if (range === "day") d.setDate(d.getDate() - 1);
  if (range === "week") d.setDate(d.getDate() - 7);
  if (range === "14days") d.setDate(d.getDate() - 14);
  if (range === "year") d.setFullYear(d.getFullYear() - 1);

  return d;
}

function groupPaymentsByDate(payments: any[], range: Range) {
  const daysCount = range === "day" ? 1 : range === "week" ? 7 : range === "14days" ? 14 : 365;

  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  return days.map((day) => ({
    day,
    label: range === "year" ? day.slice(5) : day.slice(5),
    amount: payments
      .filter((p) => String(p.created_at).slice(0, 10) === day)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0),
  }));
}

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [range, setRange] = useState<Range>("14days");

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) {
      navigate({ to: "/" });
    }
  }, [ready, user, navigate]);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminStats,
  });

  const users = useQuery({
    queryKey: ["admin-users-with-subscriptions"],
    queryFn: async () => {
      const list = await listUsers();

      const withSubs = await Promise.all(
        list.map(async (u) => ({
          ...u,
          subscription: await getSubscription(u.id),
        }))
      );

      return withSubs as UserWithSub[];
    },
  });

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: listAdminOrders,
  });

  const complaints = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: listAdminComplaints,
  });

  const payments = useQuery({
    queryKey: ["admin-payments", range],
    queryFn: () => listAdminPayments(range),
  });

  const logs = useQuery({
    queryKey: ["admin-logs"],
    queryFn: listAdminLogs,
  });

  const refreshAdmin = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-users-with-subscriptions"] });
    await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    await qc.invalidateQueries({ queryKey: ["admin-orders"] });
    await qc.invalidateQueries({ queryKey: ["admin-complaints"] });
    await qc.invalidateQueries({ queryKey: ["admin-payments"] });
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    await setUserBlocked(id, blocked);
    await refreshAdmin();
    toast.success(blocked ? "Пайдаланушы бұғатталды" : "Бұғаттан шығарылды");
  };

  const addSub = async (userId: string, days: number, plan: "monthly" | "yearly") => {
    await giveSubscription(userId, days, plan);
    await refreshAdmin();
    toast.success(days === 365 ? "1 жыл жазылым қосылды" : "30 күн жазылым қосылды");
  };

  const stopSub = async (userId: string) => {
    await cancelSubscription(userId);
    await refreshAdmin();
    toast.success("Жазылым өшірілді");
  };

  const removeUser = async (u: User) => {
    const ok = confirm(`${u.full_name} аккаунтын толық өшіресіз бе?`);
    if (!ok) return;

    await deleteUserAccount(u.id);
    await refreshAdmin();
    toast.success("Аккаунт өшірілді");
  };

  const removeOrder = async (order: AdminOrder) => {
    const ok = confirm(`"${order.cargo_name}" жүгін өшіресіз бе?`);
    if (!ok) return;

    await deleteAdminOrder(order.id);
    await refreshAdmin();
    toast.success("Жүк өшірілді");
  };

  const changeComplaintStatus = async (id: string, status: "new" | "reviewed" | "closed") => {
    await updateComplaintStatus(id, status);
    await refreshAdmin();
    toast.success("Шағым статусы өзгерді");
  };

  const allUsers = users.data ?? [];
  const allOrders = (orders.data ?? []) as AdminOrder[];
  const allPayments = payments.data ?? [];
  const allComplaints = complaints.data ?? [];

  const drivers = allUsers.filter((u) => u.role === "driver");
  const clients = allUsers.filter((u) => u.role === "cargo_owner");
  const activeSubs = allUsers.filter((u) => isSubActive(u.subscription)).length;
  const blockedUsers = allUsers.filter((u) => u.status === "blocked").length;
  const revenue = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const paymentGrowth = useMemo(() => groupPaymentsByDate(allPayments, range), [allPayments, range]);
  const maxPayment = Math.max(...paymentGrowth.map((x) => x.amount), 1);

  const tabs: { k: Tab; label: string }[] = [
    { k: "dashboard", label: "Басты бет" },
    { k: "users", label: "Пайдаланушылар" },
    { k: "drivers", label: "Жүргізушілер" },
    { k: "orders", label: "Жүктер" },
    { k: "complaints", label: "Шағымдар" },
    { k: "payments", label: "Түсім" },
    { k: "logs", label: "Логтар" },
  ];

  const s = stats.data;

  const cards = [
    { label: "Барлық қолданушы", val: allUsers.length },
    { label: "Жүк иелері", val: clients.length },
    { label: "Жүргізушілер", val: drivers.length },
    { label: "Белсенді жазылым", val: activeSubs },
    { label: "Бұғатталған", val: blockedUsers },
    { label: "Жүктер", val: allOrders.length },
    { label: "Белсенді көліктер", val: s?.activeSearches ?? 0 },
    { label: "Түсім", val: kzt(revenue) },
  ];

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <aside className="admin-sidebar">
        <div className="logo">
          <div className="logo-icon">A</div> ARGO
        </div>

        {tabs.map((x) => (
          <button
            key={x.k}
            className={`admin-nav-item${tab === x.k ? " active" : ""}`}
            onClick={() => setTab(x.k)}
          >
            <Icon.shield /> {x.label}
          </button>
        ))}

        <button
          className="admin-nav-item"
          onClick={() => navigate({ to: "/" })}
          style={{ marginTop: "auto" }}
        >
          <Icon.logout /> Сайтқа қайту
        </button>
      </aside>

      <main className="admin-main admin-main-mobile-pad">
        <div className="tabs" style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
          {tabs.map((x) => (
            <button
              key={x.k}
              className={`tab${tab === x.k ? " active" : ""}`}
              onClick={() => setTab(x.k)}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {cards.map((c) => (
                <div className="stat-card" key={c.label}>
                  <div className="stat-val">{c.val}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            <RevenueChart
              range={range}
              setRange={setRange}
              paymentGrowth={paymentGrowth}
              maxPayment={maxPayment}
              revenue={revenue}
            />
          </div>
        )}

        {tab === "users" && (
          <UsersTable
            users={allUsers}
            onBlock={toggleBlock}
            onDelete={removeUser}
            onAddSub={addSub}
            onCancelSub={stopSub}
          />
        )}

        {tab === "drivers" && (
          <UsersTable
            users={drivers}
            onBlock={toggleBlock}
            onDelete={removeUser}
            onAddSub={addSub}
            onCancelSub={stopSub}
            driversOnly
          />
        )}

        {tab === "orders" && <OrdersTable orders={allOrders} onDelete={removeOrder} />}

        {tab === "complaints" && (
          <ComplaintsTable complaints={allComplaints} onStatus={changeComplaintStatus} orders={allOrders} />
        )}

        {tab === "payments" && (
          <PaymentsTable
            payments={allPayments}
            range={range}
            setRange={setRange}
            paymentGrowth={paymentGrowth}
            maxPayment={maxPayment}
            revenue={revenue}
          />
        )}

        {tab === "logs" && (
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(logs.data ?? []).map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.action}</td>
                    <td>
                      {l.entity_type} #{l.entity_id}
                    </td>
                    <td>{shortDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function RevenueChart({
  range,
  setRange,
  paymentGrowth,
  maxPayment,
  revenue,
}: {
  range: Range;
  setRange: (r: Range) => void;
  paymentGrowth: { day: string; label: string; amount: number }[];
  maxPayment: number;
  revenue: number;
}) {
  return (
    <div className="card">
      <div className="sec-header">
        <h2>Түсім графигі</h2>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button className={`tab${range === "day" ? " active" : ""}`} onClick={() => setRange("day")}>
          Соңғы күн
        </button>
        <button className={`tab${range === "week" ? " active" : ""}`} onClick={() => setRange("week")}>
          Соңғы апта
        </button>
        <button className={`tab${range === "14days" ? " active" : ""}`} onClick={() => setRange("14days")}>
          14 күн
        </button>
        <button className={`tab${range === "year" ? " active" : ""}`} onClick={() => setRange("year")}>
          Соңғы жыл
        </button>
      </div>

      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>{kzt(revenue)}</div>

      <div style={{ display: "flex", alignItems: "end", gap: 6, minHeight: 220, paddingTop: 20, overflowX: "auto" }}>
        {paymentGrowth.map((x) => (
          <div
            key={x.day}
            style={{
              minWidth: range === "year" ? 22 : 42,
              flex: range === "year" ? "0 0 22px" : 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800 }}>{x.amount ? kzt(x.amount) : "0"}</div>

            <div
              title={`${x.day}: ${kzt(x.amount)}`}
              style={{
                width: "100%",
                minHeight: 6,
                height: `${Math.max(6, (x.amount / maxPayment) * 160)}px`,
                borderRadius: 8,
                background: "var(--fg)",
              }}
            />

            <div className="text-muted" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
              {x.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTable({
  users,
  onBlock,
  onDelete,
  onAddSub,
  onCancelSub,
  driversOnly = false,
}: {
  users: UserWithSub[];
  onBlock: (id: string, blocked: boolean) => Promise<void>;
  onDelete: (user: User) => Promise<void>;
  onAddSub: (id: string, days: number, plan: "monthly" | "yearly") => Promise<void>;
  onCancelSub: (id: string) => Promise<void>;
  driversOnly?: boolean;
}) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div className="sec-header">
        <h2>{driversOnly ? "Жүргізушілер" : "Пайдаланушылар"}</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Аты-жөні</th>
            <th>Телефон</th>
            <th>Рөлі</th>
            <th>Статус</th>
            <th>Жазылым</th>
            <th>Әрекет</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => {
            const active = isSubActive(u.subscription);

            return (
              <tr key={u.id}>
                <td>
                  <b>{u.full_name}</b>
                  {u.company_name && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {u.company_name}
                    </div>
                  )}
                </td>

                <td>{u.phone}</td>

                <td>
                  <span className="chip">
                    {u.role === "driver" ? "Жүргізуші" : u.role === "cargo_owner" ? "Жүк иесі" : "Админ"}
                  </span>
                </td>

                <td>
                  <span className={`chip ${u.status === "blocked" ? "danger" : "success"}`}>
                    {u.status === "blocked" ? "Бұғатталған" : "Белсенді"}
                  </span>
                </td>

                <td>
                  <span className={`chip ${active ? "success" : "danger"}`}>{active ? "Active" : "Жоқ"}</span>

                  {u.subscription && (
                    <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {u.subscription.plan} · {daysLeft(u.subscription)} күн қалды
                    </div>
                  )}
                </td>

                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button
                      className="btn accent"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => onAddSub(u.id, 30, "monthly")}
                    >
                      30 күн
                    </button>

                    <button
                      className="btn primary"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => onAddSub(u.id, 365, "yearly")}
                    >
                      1 жыл
                    </button>

                    <button
                      className="btn ghost"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => onCancelSub(u.id)}
                    >
                      Подписканы өшіру
                    </button>

                    {u.status === "blocked" ? (
                      <button
                        className="btn accent"
                        style={{ padding: "6px 10px", fontSize: 12 }}
                        onClick={() => onBlock(u.id, false)}
                      >
                        Бұғаттан шығару
                      </button>
                    ) : (
                      <button
                        className="btn danger"
                        style={{ padding: "6px 10px", fontSize: 12 }}
                        onClick={() => onBlock(u.id, true)}
                      >
                        Бұғаттау
                      </button>
                    )}

                    <button
                      className="btn danger"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => onDelete(u)}
                    >
                      Аккаунтты өшіру
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {users.length === 0 && (
            <tr>
              <td colSpan={6}>
                <div className="empty-state">
                  <h3>Дерек жоқ</h3>
                  <p>Бұл бөлімде әлі қолданушы жоқ.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({
  orders,
  onDelete,
}: {
  orders: AdminOrder[];
  onDelete: (order: AdminOrder) => Promise<void>;
}) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div className="sec-header">
        <h2>Жүктер</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Жүк</th>
            <th>Маршрут</th>
            <th>Жариялаған</th>
            <th>Телефон</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Әрекет</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.cargo_name}</b>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {o.vehicle_type} · {o.weight} т · {o.volume} м³
                </div>
              </td>

              <td>
                {o.from_city} → {o.to_city}
              </td>

              <td>
                <b>{o.owner?.full_name || "—"}</b>
                {o.owner?.company_name && (
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {o.owner.company_name}
                  </div>
                )}
              </td>

              <td>{o.owner?.phone || o.contact_phone || "—"}</td>

              <td>
                <span className={`chip ${o.status === "deleted" ? "danger" : "success"}`}>{o.status}</span>
              </td>

              <td>{shortDate(o.created_at)}</td>

              <td>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => location.href = `/orders/${o.id}`}>
                    Ашу
                  </button>

                  {o.status !== "deleted" && (
                    <button className="btn danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onDelete(o)}>
                      Өшіру
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {orders.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <h3>Жүк жоқ</h3>
                  <p>Әлі ешкім жүк жарияламаған.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ComplaintsTable({
  complaints,
  onStatus,
  orders,
}: {
  complaints: any[];
  onStatus: (id: string, status: "new" | "reviewed" | "closed") => Promise<void>;
  orders: AdminOrder[];
}) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div className="sec-header">
        <h2>Шағымдар</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Кім жіберді</th>
            <th>Неге қатысты</th>
            <th>Себеп</th>
            <th>Сипаттама</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Әрекет</th>
          </tr>
        </thead>

        <tbody>
          {complaints.map((c) => {
            const relatedOrder = c.target_type === "order" ? orders.find((o) => o.id === c.target_id) : undefined;

            return (
              <tr key={c.id}>
                <td>
                  <b>{c.user?.full_name || "—"}</b>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {c.user?.phone || "—"}
                  </div>
                </td>

                <td>
                  <b>{c.target_type}</b> #{String(c.target_id).slice(0, 8)}
                  {relatedOrder && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {relatedOrder.cargo_name}: {relatedOrder.from_city} → {relatedOrder.to_city}
                    </div>
                  )}
                </td>

                <td>{c.reason}</td>

                <td>{c.description || "—"}</td>

                <td>
                  <span className={`chip ${c.status === "closed" ? "success" : c.status === "reviewed" ? "accent" : "danger"}`}>
                    {c.status}
                  </span>
                </td>

                <td>{shortDate(c.created_at)}</td>

                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onStatus(c.id, "reviewed")}>
                      Қаралды
                    </button>
                    <button className="btn accent" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onStatus(c.id, "closed")}>
                      Жабу
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {complaints.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <h3>Шағым жоқ</h3>
                  <p>Әзірге шағым түспеген.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTable({
  payments,
  range,
  setRange,
  paymentGrowth,
  maxPayment,
  revenue,
}: {
  payments: any[];
  range: Range;
  setRange: (r: Range) => void;
  paymentGrowth: { day: string; label: string; amount: number }[];
  maxPayment: number;
  revenue: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <RevenueChart
        range={range}
        setRange={setRange}
        paymentGrowth={paymentGrowth}
        maxPayment={maxPayment}
        revenue={revenue}
      />

      <div className="card" style={{ overflowX: "auto" }}>
        <div className="sec-header">
          <h2>Төлем тарихы</h2>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Аккаунт</th>
              <th>Телефон</th>
              <th>Тариф</th>
              <th>Сома</th>
              <th>Көзі</th>
              <th>Дата</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.user?.full_name || "—"}</b>
                  {p.user?.company_name && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {p.user.company_name}
                    </div>
                  )}
                </td>

                <td>{p.user?.phone || "—"}</td>
                <td>{p.plan}</td>
                <td>
                  <b>{kzt(Number(p.amount || 0))}</b>
                </td>
                <td>{p.source || "admin"}</td>
                <td>{shortDate(p.created_at)}</td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <h3>Түсім жоқ</h3>
                    <p>Бұл периодта төлем тіркелмеген.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}