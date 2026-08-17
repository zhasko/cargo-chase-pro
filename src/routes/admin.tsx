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
  listAdminOrders,
  listAdminPayments,
  listUsers,
  setUserBlocked,
  updateComplaintStatus,
} from "@/lib/services";

import { useAuth } from "@/lib/store";
import type {
  Order,
  Subscription,
  User,
} from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ARGO" },
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),
  component: Admin,
});

type Tab =
  | "dashboard"
  | "users"
  | "drivers"
  | "orders"
  | "complaints"
  | "payments"
  | "logs";

type Range =
  | "day"
  | "week"
  | "14days"
  | "year";

type UserWithSub = User & {
  subscription?: Subscription | null;
};

type AdminOrder = Order & {
  owner?: User;
};

function isSubActive(
  sub?: Subscription | null
) {
  if (!sub) return false;

  return (
    sub.status === "active" &&
    new Date(sub.expires_at).getTime() >
      Date.now()
  );
}

function daysLeft(
  sub?: Subscription | null
) {
  if (!sub) return 0;

  const diff =
    new Date(sub.expires_at).getTime() -
    Date.now();

  return Math.max(
    0,
    Math.ceil(
      diff /
        (1000 * 60 * 60 * 24)
    )
  );
}

function groupPaymentsByDate(
  payments: any[],
  range: Range
) {
  const daysCount =
    range === "day"
      ? 1
      : range === "week"
        ? 7
        : range === "14days"
          ? 14
          : 365;

  const days = Array.from({
    length: daysCount,
  }).map((_, i) => {
    const d = new Date();

    d.setDate(
      d.getDate() -
        (daysCount - 1 - i)
    );

    return d
      .toISOString()
      .slice(0, 10);
  });

  return days.map((day) => ({
    day,
    label: day.slice(5),
    amount: payments
      .filter(
        (p) =>
          String(
            p.created_at
          ).slice(0, 10) === day
      )
      .reduce(
        (sum, p) =>
          sum +
          Number(
            p.amount || 0
          ),
        0
      ),
  }));
}


type Lang = "kk" | "ru" | "en";

const translations = {
  kk: {
    admin: "Админ",
    home: "Басты бет",
    users: "Пайдаланушылар",
    drivers: "Жүргізушілер",
    orders: "Жүктер",
    complaints: "Шағымдар",
    payments: "Түсім",
    logs: "Логтар",

    loading: "Жүктелуде...",
    backToSite: "Сайтқа қайту",

    allUsers: "Барлық қолданушы",
    cargoOwners: "Жүк иелері",
    activeSubscriptions: "Белсенді жазылым",
    blocked: "Бұғатталған",
    activeOrders: "Белсенді жүктер",
    deletedOrders: "Өшірілген жүктер",
    activeTrucks: "Белсенді көліктер",
    revenue: "Түсім",

    revenueChart: "Түсім графигі",
    lastDay: "Соңғы күн",
    lastWeek: "Соңғы апта",
    fourteenDays: "14 күн",
    lastYear: "Соңғы жыл",

    search: "Клиент ID, аты-жөні, телефон немесе компания бойынша іздеу...",
    found: "Табылды",
    role: "Рөл",
    all: "Барлығы",
    driver: "Жүргізуші",
    cargoOwner: "Жүк иесі",
    subscription: "Жазылым",
    active: "Белсенді",
    none: "Жоқ",
    expired: "Мерзімі өткен",
    status: "Статус",
    resetFilters: "Фильтрді тазарту",

    name: "Аты-жөні",
    phone: "Телефон",
    action: "Әрекет",
    profile: "Профильді ашу",
    noUser: "Аты көрсетілмеген",
    company: "Компания",
    clientId: "Клиент ID",

    accountInfo: "Аккаунт ақпараты",
    accountManagement: "Аккаунтты басқару",
    subscriptionManagement: "Жазылымды басқару",
    currentSubscription: "Қазіргі жазылым",
    addSubscription: "Жаңа жазылым қосу",
    oneDay: "1 күн",
    oneMonth: "1 ай / 30 күн",
    oneYear: "1 жыл / 365 күн",
    cancelSubscription: "Подписканы өшіру",
    cancel: "Өшіру",
    expiredSubscription: "Мерзімі өткен",
    noSubscription: "Жазылым жоқ",

    block: "Бұғаттау",
    unblock: "Бұғаттан шығару",
    deleteAccount: "Аккаунтты өшіру",
    processing: "Өңделуде...",
    deleting: "Өшірілуде...",
    adding: "Қосылуда...",

    cargo: "Жүк",
    route: "Маршрут",
    publishedBy: "Жариялаған",
    date: "Дата",
    open: "Ашу",
    delete: "Өшіру",
    noCargo: "Жүк жоқ",
    noCargoText: "Әлі ешкім жүк жарияламаған.",

    whoSent: "Кім жіберді",
    regarding: "Неге қатысты",
    reason: "Себеп",
    description: "Сипаттама",
    reviewed: "Қаралды",
    close: "Жабу",
    noComplaints: "Шағым жоқ",

    paymentHistory: "Төлем тарихы",
    account: "Аккаунт",
    plan: "Тариф",
    amount: "Сома",
    source: "Көзі",
    noRevenue: "Түсім жоқ",

    adminLogs: "Әкімшілік логтар",
    entity: "Entity",
    noLogs: "Лог жоқ",

    accessDenied: "Админ панельге рұқсат жоқ",
    notAdmin: "Бұл аккаунт администратор емес.",
    siteReturn: "Сайтқа қайту",
  },

  ru: {
    admin: "Админ",
    home: "Главная",
    users: "Пользователи",
    drivers: "Водители",
    orders: "Грузы",
    complaints: "Жалобы",
    payments: "Доход",
    logs: "Логи",

    loading: "Загрузка...",
    backToSite: "Вернуться на сайт",

    allUsers: "Всего пользователей",
    cargoOwners: "Владельцы грузов",
    activeSubscriptions: "Активные подписки",
    blocked: "Заблокированные",
    activeOrders: "Активные грузы",
    deletedOrders: "Удалённые грузы",
    activeTrucks: "Активные машины",
    revenue: "Доход",

    revenueChart: "График дохода",
    lastDay: "Последний день",
    lastWeek: "Последняя неделя",
    fourteenDays: "14 дней",
    lastYear: "Последний год",

    search: "Поиск по ID клиента, имени, телефону или компании...",
    found: "Найдено",
    role: "Роль",
    all: "Все",
    driver: "Водитель",
    cargoOwner: "Владелец груза",
    subscription: "Подписка",
    active: "Активна",
    none: "Нет",
    expired: "Истекла",
    status: "Статус",
    resetFilters: "Сбросить фильтры",

    name: "Имя",
    phone: "Телефон",
    action: "Действие",
    profile: "Открыть профиль",
    noUser: "Имя не указано",
    company: "Компания",
    clientId: "ID клиента",

    accountInfo: "Информация об аккаунте",
    accountManagement: "Управление аккаунтом",
    subscriptionManagement: "Управление подпиской",
    currentSubscription: "Текущая подписка",
    addSubscription: "Добавить подписку",
    oneDay: "1 день",
    oneMonth: "1 месяц / 30 дней",
    oneYear: "1 год / 365 дней",
    cancelSubscription: "Отменить подписку",
    cancel: "Отключить",
    processing: "Обработка...",
    deleting: "Удаление...",
    adding: "Добавление...",

    cargo: "Груз",
    route: "Маршрут",
    publishedBy: "Опубликовал",
    date: "Дата",
    open: "Открыть",
    delete: "Удалить",
    noCargo: "Грузов нет",
    noCargoText: "Пока никто не опубликовал груз.",

    whoSent: "Кто отправил",
    regarding: "К чему относится",
    reason: "Причина",
    description: "Описание",
    reviewed: "Рассмотрено",
    close: "Закрыть",
    noComplaints: "Жалоб нет",

    paymentHistory: "История платежей",
    account: "Аккаунт",
    plan: "Тариф",
    amount: "Сумма",
    source: "Источник",
    noRevenue: "Доход отсутствует",

    adminLogs: "Административные логи",
    entity: "Объект",
    noLogs: "Логов нет",

    accessDenied: "Нет доступа к админ-панели",
    notAdmin: "Этот аккаунт не является администратором.",
    siteReturn: "Вернуться на сайт",
  },

  en: {
    admin: "Admin",
    home: "Dashboard",
    users: "Users",
    drivers: "Drivers",
    orders: "Cargo",
    complaints: "Complaints",
    payments: "Revenue",
    logs: "Logs",

    loading: "Loading...",
    backToSite: "Back to website",

    allUsers: "All users",
    cargoOwners: "Cargo owners",
    activeSubscriptions: "Active subscriptions",
    blocked: "Blocked",
    activeOrders: "Active cargo",
    deletedOrders: "Deleted cargo",
    activeTrucks: "Active trucks",
    revenue: "Revenue",

    revenueChart: "Revenue chart",
    lastDay: "Last day",
    lastWeek: "Last week",
    fourteenDays: "14 days",
    lastYear: "Last year",

    search: "Search by client ID, name, phone or company...",
    found: "Found",
    role: "Role",
    all: "All",
    driver: "Driver",
    cargoOwner: "Cargo owner",
    subscription: "Subscription",
    active: "Active",
    none: "None",
    expired: "Expired",
    status: "Status",
    resetFilters: "Reset filters",

    name: "Name",
    phone: "Phone",
    action: "Action",
    profile: "Open profile",
    noUser: "Name not specified",
    company: "Company",
    clientId: "Client ID",

    accountInfo: "Account information",
    accountManagement: "Account management",
    subscriptionManagement: "Subscription management",
    currentSubscription: "Current subscription",
    addSubscription: "Add subscription",
    oneDay: "1 day",
    oneMonth: "1 month / 30 days",
    oneYear: "1 year / 365 days",
    cancelSubscription: "Cancel subscription",
    cancel: "Disable",
    processing: "Processing...",
    deleting: "Deleting...",
    adding: "Adding...",

    cargo: "Cargo",
    route: "Route",
    publishedBy: "Published by",
    date: "Date",
    open: "Open",
    delete: "Delete",
    noCargo: "No cargo",
    noCargoText: "No one has published cargo yet.",

    whoSent: "Sent by",
    regarding: "Regarding",
    reason: "Reason",
    description: "Description",
    reviewed: "Reviewed",
    close: "Close",
    noComplaints: "No complaints",

    paymentHistory: "Payment history",
    account: "Account",
    plan: "Plan",
    amount: "Amount",
    source: "Source",
    noRevenue: "No revenue",

    adminLogs: "Admin logs",
    entity: "Entity",
    noLogs: "No logs",

    accessDenied: "Admin panel access denied",
    notAdmin: "This account is not an administrator.",
    siteReturn: "Back to website",
  },
} as const;



function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    user,
    ready,
  } = useAuth();

  const [tab, setTab] =
    useState<Tab>("dashboard");

  const [range, setRange] =
    useState<Range>("14days");

  /*
   * ADMIN ACCESS
   */
  useEffect(() => {
  if (!ready) return;

  if (!user) {
    navigate({
      to: "/",
      replace: true,
    });
  }
}, [ready, user, navigate]);

const [lang, setLang] = useState<Lang>(() => {
  return (
    (localStorage.getItem("argo-admin-lang") as Lang) ||
    "kk"
  );
});

const t = translations[lang];

useEffect(() => {
  localStorage.setItem("argo-admin-lang", lang);
}, [lang]);

  /*
   * USERS
   */
  const users = useQuery({
    queryKey: [
      "admin-users-with-subscriptions",
    ],

    queryFn: async () => {
      const list =
        await listUsers();

      const result = await Promise.all(
  list.map(async (u) => {
    try {
      const subscription =
        await getSubscription(u.id);

      return {
        ...u,
        subscription,
      };
    } catch {
      return {
        ...u,
        subscription: null,
      };
    }
  })
);

return result as UserWithSub[];

      return result as UserWithSub[];
    },

    enabled:
      ready &&
      user?.role === "admin",
  });

  /*
   * ORDERS
   */
  const orders = useQuery({
    queryKey: [
      "admin-orders",
    ],

    queryFn:
      listAdminOrders,

    enabled:
      ready &&
      user?.role === "admin",
  });

  /*
   * COMPLAINTS
   */
  const complaints = useQuery({
    queryKey: [
      "admin-complaints",
    ],

    queryFn:
      listAdminComplaints,

    enabled:
      ready &&
      user?.role === "admin",
  });

  /*
   * PAYMENTS
   */
  const payments = useQuery({
    queryKey: [
      "admin-payments",
      range,
    ],

    queryFn: () =>
      listAdminPayments(
        range
      ),

    enabled:
      ready &&
      user?.role === "admin",
  });

  /*
   * REFRESH
   */
  const refreshAdmin =
    async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: [
            "admin-users-with-subscriptions",
          ],
        }),

        qc.invalidateQueries({
          queryKey: [
            "admin-orders",
          ],
        }),

        qc.invalidateQueries({
          queryKey: [
            "admin-complaints",
          ],
        }),

        qc.invalidateQueries({
          queryKey: [
            "admin-payments",
          ],
        }),

        qc.invalidateQueries({
          queryKey: [
            "admin-logs",
          ],
        }),
      ]);
    };

  /*
   * BLOCK USER
   */
  const toggleBlock =
    async (
      id: string,
      blocked: boolean
    ) => {
      try {
        await setUserBlocked(
          id,
          blocked
        );

        await refreshAdmin();

        toast.success(
          blocked
            ? "Пайдаланушы бұғатталды"
            : "Бұғаттан шығарылды"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Операция орындалмады"
        );
      }
    };

  /*
   * ADD SUBSCRIPTION
   */
  const addSub =
    async (
      userId: string,
      days: number,
      plan:
        | "monthly"
        | "yearly"
    ) => {
      try {
        await giveSubscription(
          userId,
          days,
          plan
        );

        await refreshAdmin();

        if (days === 1) {
          toast.success(
            "1 күндік жазылым қосылды"
          );
        } else if (
          days === 30
        ) {
          toast.success(
            "30 күндік жазылым қосылды"
          );
        } else if (
          days === 365
        ) {
          toast.success(
            "1 жылдық жазылым қосылды"
          );
        }
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Жазылым қосылмады"
        );
      }
    };

  /*
   * CANCEL SUBSCRIPTION
   */
  const stopSub =
    async (
      userId: string
    ) => {
      const ok =
        window.confirm(
          "Бұл пайдаланушының жазылымын өшіруге сенімдісіз бе?"
        );

      if (!ok) return;

      try {
        await cancelSubscription(
          userId
        );

        await refreshAdmin();

        toast.success(
          "Жазылым өшірілді"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Жазылымды өшіру мүмкін болмады"
        );
      }
    };

  /*
   * DELETE USER
   */
  const removeUser =
    async (
      u: User
    ) => {
      const ok =
        window.confirm(
          `${u.full_name || "Бұл қолданушы"} аккаунтын толық өшіресіз бе?\n\nБұл әрекетті кері қайтару мүмкін емес.`
        );

      if (!ok) return;

      try {
        await deleteUserAccount(
          u.id
        );

        await refreshAdmin();

        toast.success(
          "Аккаунт өшірілді"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Аккаунтты өшіру мүмкін болмады"
        );
      }
    };

  /*
   * DELETE ORDER
   */
  const removeOrder =
    async (
      order: AdminOrder
    ) => {
      const ok =
        window.confirm(
          `"${order.cargo_name}" жүгін өшіресіз бе?`
        );

      if (!ok) return;

      try {
        await deleteAdminOrder(
          order.id
        );

        await refreshAdmin();

        toast.success(
          "Жүк өшірілді"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Жүкті өшіру мүмкін болмады"
        );
      }
    };

  /*
   * COMPLAINT STATUS
   */
  const changeComplaintStatus =
    async (
      id: string,
      status:
        | "new"
        | "reviewed"
        | "closed"
    ) => {
      try {
        await updateComplaintStatus(
          id,
          status
        );

        await refreshAdmin();

        toast.success(
          "Шағым статусы өзгерді"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Статусты өзгерту мүмкін болмады"
        );
      }
    };

  /*
   * DATA
   */
  const allUsers =
    users.data ?? [];

  const allOrders =
    (orders.data ??
      []) as AdminOrder[];

  const allPayments =
    payments.data ?? [];

  const allComplaints =
    complaints.data ?? [];

  /*
   * STATISTICS
   */
  const drivers =
    allUsers.filter(
      (u) =>
        u.role ===
        "driver"
    );

  const clients =
    allUsers.filter(
      (u) =>
        u.role ===
        "cargo_owner"
    );

  const activeSubs =
    allUsers.filter(
      (u) =>
        isSubActive(
          u.subscription
        )
    ).length;

  const blockedUsers =
    allUsers.filter(
      (u) =>
        u.status ===
        "blocked"
    ).length;

  const activeOrders =
    allOrders.filter(
      (o) =>
        o.status ===
        "active"
    ).length;

  const deletedOrders =
    allOrders.filter(
      (o) =>
        o.status ===
        "deleted"
    ).length;

  const revenue =
    allPayments.reduce(
      (
        sum: number,
        p: any
      ) =>
        sum +
        Number(
          p.amount || 0
        ),
      0
    );

  /*
   * PAYMENT CHART
   */
  const paymentGrowth =
    useMemo(
      () =>
        groupPaymentsByDate(
          allPayments,
          range
        ),
      [
        allPayments,
        range,
      ]
    );

  const maxPayment =
    Math.max(
      ...paymentGrowth.map(
        (x) => x.amount
      ),
      1
    );

  /*
   * NAVIGATION
   */
  const tabs: {
  k: Tab;
  label: string;
}[] = [
  {
    k: "dashboard",
    label: t.home,
  },
  {
    k: "users",
    label: t.users,
  },
  {
    k: "drivers",
    label: t.drivers,
  },
  {
    k: "orders",
    label: t.orders,
  },
  {
    k: "complaints",
    label: t.complaints,
  },
  {
    k: "payments",
    label: t.payments,
  },
  {
    k: "logs",
    label: t.logs,
  },
];

  /*
   * DASHBOARD CARDS
   */
  const cards = [
    {
      label:
        "Барлық қолданушы",
      val: allUsers.length,
    },
    {
      label:
        "Жүк иелері",
      val: clients.length,
    },
    {
      label:
        "Жүргізушілер",
      val: drivers.length,
    },
    {
      label:
        "Белсенді жазылым",
      val: activeSubs,
    },
    {
      label:
        "Бұғатталған",
      val: blockedUsers,
    },
    {
      label:
        "Белсенді жүктер",
      val: activeOrders,
    },
    {
      label:
        "Өшірілген жүктер",
      val: deletedOrders,
    },
    {
      label:
        "Белсенді көліктер",
      val: "—",
    },
    {
      label:
        "Түсім",
      val: kzt(revenue),
    },
  ];

  /*
   * LOADING
   */
  if (!ready) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "grid",
          placeItems:
            "center",
        }}
      >
        <div className="card">
          Жүктелуде...
        </div>
      </div>
    );
  }

  if (!user) {
  return null;
}

if (!ready) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div className="card">
        Жүктелуде...
      </div>
    </div>
  );
}

if (!user) {
  return null;
}

if (user.role !== "admin") {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 44,
            marginBottom: 14,
          }}
        >
          🔒
        </div>

        <h2>
          Админ панельге рұқсат жоқ
        </h2>

        <p
          className="text-muted"
          style={{
            marginTop: 8,
          }}
        >
          Бұл аккаунт администратор емес.
        </p>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            border:
              "1px solid var(--border)",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          Role: {String(user.role)}
        </div>

        <button
          className="btn primary"
          style={{
            marginTop: 18,
          }}
          onClick={() =>
            navigate({
              to: "/",
            })
          }
        >
          Сайтқа қайту
        </button>
      </div>
    </div>
  );
}

  return (
  <div
    style={{
      minHeight: "100vh",
      position: "relative",
    }}
  >

    <div
  style={{
    position: "fixed",
    top: 18,
    right: 24,
    zIndex: 1000,
    display: "flex",
    gap: 4,
    padding: 4,
    border: "1px solid var(--border)",
    borderRadius: 10,
    background: "var(--bg)",
  }}
>
  {(["kk", "ru", "en"] as Lang[]).map((l) => (
    <button
      key={l}
      onClick={() => setLang(l)}
      className={`tab ${lang === l ? "active" : ""}`}
      style={{
        padding: "6px 10px",
        fontSize: 12,
        textTransform: "uppercase",
      }}
    >
      {l}
    </button>
  ))}
</div>
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="logo">
          <div className="logo-icon">
            A
          </div>

          ARGO
        </div>

        {tabs.map(
          (x) => (
            <button
              key={x.k}
              className={`admin-nav-item${
                tab === x.k
                  ? " active"
                  : ""
              }`}
              onClick={() =>
                setTab(x.k)
              }
            >
              <Icon.shield />

              {x.label}
            </button>
          )
        )}

        <button
          className="admin-nav-item"
          onClick={() =>
            navigate({
              to: "/",
            })
          }
          style={{
            marginTop:
              "auto",
          }}
        >
          <Icon.logout />

          Сайтқа қайту
        </button>
      </aside>

      {/* MAIN */}
      <main className="admin-main admin-main-mobile-pad">
        {/* MOBILE / TOP TABS */}
        <div
          className="tabs"
          style={{
            display:
              "flex",
            flexWrap:
              "wrap",
            marginBottom:
              20,
          }}
        >
          {tabs.map(
            (x) => (
              <button
                key={x.k}
                className={`tab${
                  tab === x.k
                    ? " active"
                    : ""
                }`}
                onClick={() =>
                  setTab(x.k)
                }
              >
                {x.label}
              </button>
            )
          )}
        </div>

        {/* DASHBOARD */}
        {tab ===
          "dashboard" && (
          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              {cards.map(
                (c) => (
                  <div
                    className="stat-card"
                    key={
                      c.label
                    }
                  >
                    <div className="stat-val">
                      {
                        c.val
                      }
                    </div>

                    <div className="stat-label">
                      {
                        c.label
                      }
                    </div>
                  </div>
                )
              )}
            </div>

            <RevenueChart
              range={
                range
              }
              setRange={
                setRange
              }
              paymentGrowth={
                paymentGrowth
              }
              maxPayment={
                maxPayment
              }
              revenue={
                revenue
              }
            />
          </div>
        )}

        {/* USERS */}
        {tab ===
          "users" && (
          <UsersTable
            users={
              allUsers
            }
            onBlock={
              toggleBlock
            }
            onDelete={
              removeUser
            }
            onAddSub={
              addSub
            }
            onCancelSub={
              stopSub
            }
          />
        )}

        {/* DRIVERS */}
        {tab ===
          "drivers" && (
          <UsersTable
            users={
              drivers
            }
            onBlock={
              toggleBlock
            }
            onDelete={
              removeUser
            }
            onAddSub={
              addSub
            }
            onCancelSub={
              stopSub
            }
            driversOnly
          />
        )}

        {/* ORDERS */}
        {tab ===
          "orders" && (
          <OrdersTable
            orders={
              allOrders
            }
            onDelete={
              removeOrder
            }
          />
        )}

        {/* COMPLAINTS */}
        {tab ===
          "complaints" && (
          <ComplaintsTable
            complaints={
              allComplaints
            }
            onStatus={
              changeComplaintStatus
            }
            orders={
              allOrders
            }
          />
        )}

        {/* PAYMENTS */}
        {tab ===
          "payments" && (
          <PaymentsTable
            payments={
              allPayments
            }
            range={
              range
            }
            setRange={
              setRange
            }
            paymentGrowth={
              paymentGrowth
            }
            maxPayment={
              maxPayment
            }
            revenue={
              revenue
            }
          />
        )}

        {/* LOGS */}
        {tab ===
          "logs" && (
          <LogsTable logs={[]} />
        )}
      </main>
    </div>
  );
}

/* =====================================================
   REVENUE CHART
===================================================== */

function RevenueChart({
  range,
  setRange,
  paymentGrowth,
  maxPayment,
  revenue,
}: {
  range: Range;
  setRange: (
    r: Range
  ) => void;
  paymentGrowth: {
    day: string;
    label: string;
    amount: number;
  }[];
  maxPayment: number;
  revenue: number;
}) {
  return (
    <div className="card">
      <div className="sec-header">
        <h2>
          Түсім графигі
        </h2>
      </div>

      <div
        style={{
          display:
            "flex",
          gap: 8,
          flexWrap:
            "wrap",
          marginBottom:
            14,
        }}
      >
        <button
          className={`tab${
            range ===
            "day"
              ? " active"
              : ""
          }`}
          onClick={() =>
            setRange(
              "day"
            )
          }
        >
          Соңғы күн
        </button>

        <button
          className={`tab${
            range ===
            "week"
              ? " active"
              : ""
          }`}
          onClick={() =>
            setRange(
              "week"
            )
          }
        >
          Соңғы апта
        </button>

        <button
          className={`tab${
            range ===
            "14days"
              ? " active"
              : ""
          }`}
          onClick={() =>
            setRange(
              "14days"
            )
          }
        >
          14 күн
        </button>

        <button
          className={`tab${
            range ===
            "year"
              ? " active"
              : ""
          }`}
          onClick={() =>
            setRange(
              "year"
            )
          }
        >
          Соңғы жыл
        </button>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight:
            900,
          marginBottom:
            10,
        }}
      >
        {kzt(revenue)}
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "end",
          gap: 6,
          minHeight:
            220,
          paddingTop:
            20,
          overflowX:
            "auto",
        }}
      >
        {paymentGrowth.map(
          (x) => (
            <div
              key={
                x.day
              }
              style={{
                minWidth:
                  range ===
                  "year"
                    ? 22
                    : 42,
                flex:
                  range ===
                  "year"
                    ? "0 0 22px"
                    : 1,
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight:
                    800,
                }}
              >
                {x.amount
                  ? kzt(
                      x.amount
                    )
                  : "0"}
              </div>

              <div
                title={`${x.day}: ${kzt(
                  x.amount
                )}`}
                style={{
                  width:
                    "100%",
                  minHeight:
                    6,
                  height: `${Math.max(
                    6,
                    (x.amount /
                      maxPayment) *
                      160
                  )}px`,
                  borderRadius:
                    8,
                  background:
                    "var(--fg)",
                }}
              />

              <div
                className="text-muted"
                style={{
                  fontSize: 10,
                  whiteSpace:
                    "nowrap",
                }}
              >
                {
                  x.label
                }
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =====================================================
   USERS
===================================================== */

function UsersTable({
  users,
  onBlock,
  onDelete,
  onAddSub,
  onCancelSub,
  driversOnly = false,
}: {
  users: UserWithSub[];

  onBlock: (
    id: string,
    blocked: boolean
  ) => Promise<void>;

  onDelete: (
    user: User
  ) => Promise<void>;

  onAddSub: (
    id: string,
    days: number,
    plan:
      | "monthly"
      | "yearly"
  ) => Promise<void>;

  onCancelSub: (
    id: string
  ) => Promise<void>;

  driversOnly?: boolean;
}) {
  /*
   * SEARCH
   */
  const [search, setSearch] =
    useState("");

  /*
   * FILTERS
   */
  const [roleFilter, setRoleFilter] =
    useState<
      | "all"
      | "driver"
      | "cargo_owner"
      | "admin"
    >("all");

  const [
    subscriptionFilter,
    setSubscriptionFilter,
  ] = useState<
    | "all"
    | "active"
    | "none"
    | "expired"
  >("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    | "all"
    | "active"
    | "blocked"
  >("all");

  /*
   * SELECTED PROFILE
   *
   * IMPORTANT:
   * Қолданушы таңдалғанда
   * тек профиль көрсетіледі.
   */
  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState<
    string | null
  >(null);

  /*
   * RESET FILTERS
   */
  const resetFilters =
    () => {
      setSearch("");
      setRoleFilter(
        "all"
      );
      setSubscriptionFilter(
        "all"
      );
      setStatusFilter(
        "all"
      );
    };

  /*
   * FILTERED USERS
   */
  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (u) => {
          const publicId =
  String(
    u.public_id || ""
  ).toLowerCase();

          const fullName =
            String(
              u.full_name ||
                ""
            ).toLowerCase();

          const phone =
            String(
              u.phone ||
                ""
            ).toLowerCase();

          const companyName =
            String(
              u.company_name ||
                ""
            ).toLowerCase();

          const matchesSearch =
  !query ||
  publicId === query ||
  publicId.includes(query) ||
  fullName.includes(query) ||
  phone.includes(query) ||
  companyName.includes(query);

          if (
            !matchesSearch
          ) {
            return false;
          }

          /*
           * ROLE
           */
          if (
            roleFilter !==
              "all" &&
            u.role !==
              roleFilter
          ) {
            return false;
          }

          /*
           * STATUS
           */
          if (
            statusFilter !==
              "all" &&
            u.status !==
              statusFilter
          ) {
            return false;
          }

          /*
           * SUBSCRIPTION
           */
          const active =
            isSubActive(
              u.subscription
            );

          if (
            subscriptionFilter ===
              "active" &&
            !active
          ) {
            return false;
          }

          if (
            subscriptionFilter ===
              "none" &&
            u.subscription
          ) {
            return false;
          }

          if (
            subscriptionFilter ===
              "expired" &&
            (
              !u.subscription ||
              active
            )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      users,
      search,
      roleFilter,
      subscriptionFilter,
      statusFilter,
    ]);

  /*
   * ACTIVE FILTER CHECK
   */
  const hasFilters =
    search.trim() !==
      "" ||
    roleFilter !==
      "all" ||
    subscriptionFilter !==
      "all" ||
    statusFilter !==
      "all";

  /*
   * SELECTED USER
   */
  const selectedUser =
    selectedUserId
      ? users.find(
          (u) =>
            u.id ===
            selectedUserId
        )
      : null;

  /*
   * PROFILE PAGE
   */
  if (selectedUser) {
    return (
      <UserProfile
        user={
          selectedUser
        }
        onBack={() =>
          setSelectedUserId(
            null
          )
        }
        onBlock={
          onBlock
        }
        onDelete={
          onDelete
        }
        onAddSub={
          onAddSub
        }
        onCancelSub={
          onCancelSub
        }
      />
    );
  }

  return (
    <div
      className="card"
      style={{
        overflowX:
          "auto",
      }}
    >
      {/* HEADER */}
      <div
        className="sec-header"
        style={{
          alignItems:
            "center",
          gap: 12,
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h2>
            {driversOnly
              ? "Жүргізушілер"
              : "Пайдаланушылар"}
          </h2>

          <div
            className="text-muted"
            style={{
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Табылды:{" "}
            <b>
              {
                filteredUsers.length
              }
            </b>
            {" / "}
            {
              users.length
            }
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div
        style={{
          display:
            "flex",
          flexDirection:
            "column",
          gap: 12,
          marginBottom:
            18,
        }}
      >
        {/* SEARCH */}
        <div
          style={{
            position:
              "relative",
          }}
        >
          <input
            type="text"
            value={
              search
            }
            onChange={(
              e
            ) =>
              setSearch(
                e.target
                  .value
              )
            }
            placeholder="Клиент ID, аты-жөні, телефон немесе компания бойынша іздеу..."
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              padding:
                "12px 14px 12px 42px",
              borderRadius:
                12,
              border:
                "1px solid var(--border)",
              background:
                "var(--bg)",
              color:
                "var(--fg)",
              outline:
                "none",
              fontSize:
                14,
            }}
          />

          <div
            style={{
              position:
                "absolute",
              left: 14,
              top: "50%",
              transform:
                "translateY(-50%)",
              opacity:
                0.6,
              pointerEvents:
                "none",
            }}
          >
            🔎
          </div>
        </div>

        {/* FILTERS */}
        <div
          style={{
            display:
              "flex",
            gap: 10,
            flexWrap:
              "wrap",
            alignItems:
              "center",
          }}
        >
          {/* ROLE */}
          <select
            value={
              roleFilter
            }
            onChange={(
              e
            ) =>
              setRoleFilter(
                e.target
                  .value as
                  | "all"
                  | "driver"
                  | "cargo_owner"
                  | "admin"
              )
            }
            style={{
              padding:
                "10px 12px",
              borderRadius:
                10,
              border:
                "1px solid var(--border)",
              background:
                "var(--bg)",
              color:
                "var(--fg)",
              fontSize:
                13,
              cursor:
                "pointer",
            }}
          >
            <option value="all">
              Рөл: Барлығы
            </option>

            <option value="driver">
              Рөл: Жүргізуші
            </option>

            <option value="cargo_owner">
              Рөл: Жүк иесі
            </option>

            <option value="admin">
              Рөл: Админ
            </option>
          </select>

          {/* SUBSCRIPTION */}
          <select
            value={
              subscriptionFilter
            }
            onChange={(
              e
            ) =>
              setSubscriptionFilter(
                e.target
                  .value as
                  | "all"
                  | "active"
                  | "none"
                  | "expired"
              )
            }
            style={{
              padding:
                "10px 12px",
              borderRadius:
                10,
              border:
                "1px solid var(--border)",
              background:
                "var(--bg)",
              color:
                "var(--fg)",
              fontSize:
                13,
              cursor:
                "pointer",
            }}
          >
            <option value="all">
              Жазылым: Барлығы
            </option>

            <option value="active">
              Жазылым: Active
            </option>

            <option value="none">
              Жазылым: Жоқ
            </option>

            <option value="expired">
              Жазылым: Expired
            </option>
          </select>

          {/* STATUS */}
          <select
            value={
              statusFilter
            }
            onChange={(
              e
            ) =>
              setStatusFilter(
                e.target
                  .value as
                  | "all"
                  | "active"
                  | "blocked"
              )
            }
            style={{
              padding:
                "10px 12px",
              borderRadius:
                10,
              border:
                "1px solid var(--border)",
              background:
                "var(--bg)",
              color:
                "var(--fg)",
              fontSize:
                13,
              cursor:
                "pointer",
            }}
          >
            <option value="all">
              Статус: Барлығы
            </option>

            <option value="active">
              Статус: Белсенді
            </option>

            <option value="blocked">
              Статус: Бұғатталған
            </option>
          </select>

          {/* RESET */}
          {hasFilters && (
            <button
              className="btn ghost"
              onClick={
                resetFilters
              }
              style={{
                padding:
                  "10px 14px",
                fontSize:
                  13,
              }}
            >
              Фильтрді тазарту
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>
              Аты-жөні
            </th>
            <th>
              Телефон
            </th>
            <th>Рөлі</th>
            <th>
              Статус
            </th>
            <th>
              Жазылым
            </th>
            <th>
              Әрекет
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map(
            (u) => {
              const active =
                isSubActive(
                  u.subscription
                );

              return (
                <tr
                  key={u.id}
                >
                  {/* USER */}
                  <td>
                    <b>
                      {u.full_name ||
                        "Аты көрсетілмеген"}
                    </b>

                    <div
                      style={{
                        fontSize:
                          11,
                        marginTop:
                          5,
                        padding:
                          "5px 7px",
                        borderRadius:
                          7,
                        background:
                          "var(--bg)",
                        border:
                          "1px solid var(--border)",
                        fontFamily:
                          "monospace",
                        wordBreak:
                          "break-all",
                        cursor:
                          "pointer",
                      }}
                      title="ID-ді көшіру"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            String(
                              u.id
                            )
                          );

                          toast.success(
                            "ID көшірілді"
                          );
                        } catch {
                          toast.error(
                            "ID көшіру мүмкін болмады"
                          );
                        }
                      }}
                    >
                      ID:{" "}
                      {u.id}
                    </div>

                    {u.company_name && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize:
                            12,
                          marginTop:
                            3,
                        }}
                      >
                        {
                          u.company_name
                        }
                      </div>
                    )}
                  </td>

                  {/* PHONE */}
                  <td>
                    {u.phone ||
                      "—"}
                  </td>

                  {/* ROLE */}
                  <td>
                    <span className="chip">
                      {u.role ===
                      "driver"
                        ? "Жүргізуші"
                        : u.role ===
                            "cargo_owner"
                          ? "Жүк иесі"
                          : "Админ"}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`chip ${
                        u.status ===
                        "blocked"
                          ? "danger"
                          : "success"
                      }`}
                    >
                      {u.status ===
                      "blocked"
                        ? "Бұғатталған"
                        : "Белсенді"}
                    </span>
                  </td>

                  {/* SUBSCRIPTION */}
                  <td>
                    <span
                      className={`chip ${
                        active
                          ? "success"
                          : "danger"
                      }`}
                    >
                      {active
                        ? "Active"
                        : u.subscription
                          ? "Expired"
                          : "Жоқ"}
                    </span>

                    {u.subscription && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize:
                            12,
                          marginTop:
                            4,
                        }}
                      >
                        {
                          u.subscription
                            .plan
                        }{" "}
                        ·{" "}
                        {daysLeft(
                          u.subscription
                        )}{" "}
                        күн қалды
                      </div>
                    )}
                  </td>

                  {/* ONLY SAFE ACTION */}
                  <td>
                    <button
                      className="btn primary"
                      style={{
                        padding:
                          "7px 12px",
                        fontSize:
                          12,
                      }}
                      onClick={() =>
                        setSelectedUserId(
                          u.id
                        )
                      }
                    >
                      Профильді ашу
                    </button>
                  </td>
                </tr>
              );
            }
          )}

          {/* NO RESULTS */}
          {filteredUsers.length ===
            0 && (
            <tr>
              <td
                colSpan={
                  6
                }
              >
                <div
                  className="empty-state"
                  style={{
                    padding:
                      32,
                    textAlign:
                      "center",
                  }}
                >
                  <h3>
                    Қолданушы табылмады
                  </h3>

                  <p>
                    Іздеу немесе
                    фильтр параметрлерін
                    өзгертіп көр.
                  </p>

                  {hasFilters && (
                    <button
                      className="btn ghost"
                      onClick={
                        resetFilters
                      }
                      style={{
                        marginTop:
                          10,
                      }}
                    >
                      Фильтрді тазарту
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   USER PROFILE
===================================================== */

function UserProfile({
  user,
  onBack,
  onBlock,
  onDelete,
  onAddSub,
  onCancelSub,
}: {
  user: UserWithSub;

  onBack: () => void;

  onBlock: (
    id: string,
    blocked: boolean
  ) => Promise<void>;

  onDelete: (
    user: User
  ) => Promise<void>;

  onAddSub: (
    id: string,
    days: number,
    plan:
      | "monthly"
      | "yearly"
  ) => Promise<void>;

  onCancelSub: (
    id: string
  ) => Promise<void>;
}) {
  const active =
    isSubActive(
      user.subscription
    );

  const [loadingAction, setLoadingAction] =
    useState<string | null>(
      null
    );

  /*
   * ADD SUBSCRIPTION WITH CONFIRM
   */
  const handleAddSub =
    async (
      days: number,
      plan:
        | "monthly"
        | "yearly"
    ) => {
      let label =
        "жазылым";

      if (days === 1) {
        label =
          "1 күндік жазылым";
      }

      if (days === 30) {
        label =
          "30 күндік жазылым";
      }

      if (days === 365) {
        label =
          "1 жылдық жазылым";
      }

      const ok =
        window.confirm(
          `${user.full_name || "Бұл пайдаланушы"} үшін ${label} қосасыз ба?`
        );

      if (!ok) return;

      try {
        setLoadingAction(
          `sub-${days}`
        );

        await onAddSub(
          user.id,
          days,
          plan
        );
      } finally {
        setLoadingAction(
          null
        );
      }
    };

  /*
   * CANCEL SUB
   */
  const handleCancelSub =
    async () => {
      const ok =
        window.confirm(
          "Осы пайдаланушының белсенді жазылымын өшіруге сенімдісіз бе?"
        );

      if (!ok) return;

      try {
        setLoadingAction(
          "cancel-sub"
        );

        await onCancelSub(
          user.id
        );
      } finally {
        setLoadingAction(
          null
        );
      }
    };

  /*
   * BLOCK
   */
  const handleBlock =
    async () => {
      const currentlyBlocked =
        user.status ===
        "blocked";

      if (
        !currentlyBlocked
      ) {
        const ok =
          window.confirm(
            `${user.full_name || "Бұл пайдаланушы"} аккаунтын бұғаттайсыз ба?\n\nБұғатталған қолданушы жүйені пайдалана алмайды.`
          );

        if (!ok) return;
      }

      try {
        setLoadingAction(
          "block"
        );

        await onBlock(
          user.id,
          !currentlyBlocked
        );
      } finally {
        setLoadingAction(
          null
        );
      }
    };

  /*
   * DELETE
   */
  const handleDelete =
    async () => {
      const ok =
        window.confirm(
          `⚠️ ${user.full_name || "Бұл пайдаланушы"} аккаунтын толық өшіресіз бе?\n\nБұл әрекетті кері қайтару мүмкін емес.`
        );

      if (!ok) return;

      try {
        setLoadingAction(
          "delete"
        );

        await onDelete(
          user
        );

        /*
         * Аккаунт өшірілгеннен
         * кейін тізімге қайту.
         */
        onBack();
      } finally {
        setLoadingAction(
          null
        );
      }
    };

  return (
    <div
      style={{
        display:
          "flex",
        flexDirection:
          "column",
        gap: 18,
      }}
    >
      {/* BACK */}
      <button
        className="btn ghost"
        onClick={
          onBack
        }
        style={{
          alignSelf:
            "flex-start",
        }}
      >
        ← Пайдаланушыларға қайту
      </button>

      {/* PROFILE HEADER */}
      <div
        className="card"
        style={{
          padding: 24,
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap: 20,
            flexWrap:
              "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  26,
                fontWeight:
                  900,
                marginBottom:
                  8,
              }}
            >
              {user.full_name ||
                "Аты көрсетілмеген"}
            </div>

            <div
              className="text-muted"
              style={{
                fontSize:
                  13,
                fontFamily:
                  "monospace",
                wordBreak:
                  "break-all",
              }}
            >
              ID:{" "}
              {user.id}
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              gap: 8,
              flexWrap:
                "wrap",
            }}
          >
            <span className="chip">
              {user.role ===
              "driver"
                ? "Жүргізуші"
                : user.role ===
                    "cargo_owner"
                  ? "Жүк иесі"
                  : "Админ"}
            </span>

            <span
              className={`chip ${
                user.status ===
                "blocked"
                  ? "danger"
                  : "success"
              }`}
            >
              {user.status ===
              "blocked"
                ? "Бұғатталған"
                : "Белсенді"}
            </span>
          </div>
        </div>
      </div>

      {/* USER INFORMATION */}
      <div className="card">
        <div className="sec-header">
          <h2>
            Аккаунт ақпараты
          </h2>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <InfoItem
            label="Аты-жөні"
            value={
              user.full_name ||
              "—"
            }
          />

          <InfoItem
            label="Телефон"
            value={
              user.phone ||
              "—"
            }
          />

          <InfoItem
            label="Компания"
            value={
              user.company_name ||
              "—"
            }
          />

          <InfoItem
            label="Рөл"
            value={
              user.role ===
              "driver"
                ? "Жүргізуші"
                : user.role ===
                    "cargo_owner"
                  ? "Жүк иесі"
                  : "Админ"
            }
          />

          <InfoItem
            label="Статус"
            value={
              user.status ===
              "blocked"
                ? "Бұғатталған"
                : "Белсенді"
            }
          />

          <InfoItem
  label="Клиент ID"
  value={
    user.public_id ||
    "—"
  }
  mono
/>
        </div>
      </div>

      {/* SUBSCRIPTION */}
      <div className="card">
        <div className="sec-header">
          <h2>
            Жазылымды басқару
          </h2>
        </div>

        {/* CURRENT SUB */}
        <div
          style={{
            padding:
              16,
            border:
              "1px solid var(--border)",
            borderRadius:
              14,
            marginBottom:
              18,
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 12,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                className="text-muted"
                style={{
                  fontSize:
                    12,
                  marginBottom:
                    5,
                }}
              >
                Қазіргі жазылым
              </div>

              <div
                style={{
                  fontSize:
                    18,
                  fontWeight:
                    800,
                }}
              >
                {active
                  ? "Белсенді"
                  : user.subscription
                    ? "Мерзімі өткен"
                    : "Жазылым жоқ"}
              </div>
            </div>

            <span
              className={`chip ${
                active
                  ? "success"
                  : "danger"
              }`}
            >
              {active
                ? "Active"
                : user.subscription
                  ? "Expired"
                  : "None"}
            </span>
          </div>

          {user.subscription && (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginTop:
                  16,
              }}
            >
              <InfoItem
                label="Тариф"
                value={
                  user
                    .subscription
                    .plan
                }
              />

              <InfoItem
                label="Қалған күн"
                value={`${daysLeft(
                  user.subscription
                )} күн`}
              />

              <InfoItem
                label="Жарамды болғанша"
                value={shortDate(
                  user
                    .subscription
                    .expires_at
                )}
              />
            </div>
          )}
        </div>

        {/* ADD SUB */}
        <div>
          <div
            style={{
              fontSize:
                14,
              fontWeight:
                800,
              marginBottom:
                10,
            }}
          >
            Жаңа жазылым қосу
          </div>

          <div
            style={{
              display:
                "flex",
              gap: 10,
              flexWrap:
                "wrap",
            }}
          >
            {/* 1 DAY */}
            <button
              className="btn ghost"
              disabled={
                loadingAction !==
                null
              }
              onClick={() =>
                handleAddSub(
                  1,
                  "monthly"
                )
              }
            >
              {loadingAction ===
              "sub-1"
                ? "Қосылуда..."
                : "1 күн"}
            </button>

            {/* 30 DAYS */}
            <button
              className="btn accent"
              disabled={
                loadingAction !==
                null
              }
              onClick={() =>
                handleAddSub(
                  30,
                  "monthly"
                )
              }
            >
              {loadingAction ===
              "sub-30"
                ? "Қосылуда..."
                : "1 ай / 30 күн"}
            </button>

            {/* 1 YEAR */}
            <button
              className="btn primary"
              disabled={
                loadingAction !==
                null
              }
              onClick={() =>
                handleAddSub(
                  365,
                  "yearly"
                )
              }
            >
              {loadingAction ===
              "sub-365"
                ? "Қосылуда..."
                : "1 жыл / 365 күн"}
            </button>
          </div>
        </div>

        {/* CANCEL */}
        {active && (
          <div
            style={{
              marginTop:
                20,
              paddingTop:
                20,
              borderTop:
                "1px solid var(--border)",
            }}
          >
            <button
              className="btn ghost"
              disabled={
                loadingAction !==
                null
              }
              onClick={
                handleCancelSub
              }
            >
              {loadingAction ===
              "cancel-sub"
                ? "Өшірілуде..."
                : "Подписканы өшіру"}
            </button>
          </div>
        )}
      </div>

      {/* ACCOUNT MANAGEMENT */}
      <div
        className="card"
        style={{
          border:
            "1px solid var(--border)",
        }}
      >
        <div className="sec-header">
          <h2>
            Аккаунтты басқару
          </h2>
        </div>

        <div
          className="text-muted"
          style={{
            fontSize:
              13,
            marginBottom:
              16,
          }}
        >
          Қауіпті әрекеттер осы
          профильдің ішінде ғана
          қолжетімді.
        </div>

        <div
          style={{
            display:
              "flex",
            gap: 10,
            flexWrap:
              "wrap",
          }}
        >
          {/* BLOCK / UNBLOCK */}
          <button
            className={
              user.status ===
              "blocked"
                ? "btn accent"
                : "btn danger"
            }
            disabled={
              loadingAction !==
              null
            }
            onClick={
              handleBlock
            }
          >
            {loadingAction ===
            "block"
              ? "Өңделуде..."
              : user.status ===
                  "blocked"
                ? "Бұғаттан шығару"
                : "Бұғаттау"}
          </button>

          {/* DELETE */}
          <button
            className="btn danger"
            disabled={
              loadingAction !==
              null
            }
            onClick={
              handleDelete
            }
          >
            {loadingAction ===
            "delete"
              ? "Өшірілуде..."
              : "Аккаунтты өшіру"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        padding:
          "12px 14px",
        border:
          "1px solid var(--border)",
        borderRadius:
          12,
      }}
    >
      <div
        className="text-muted"
        style={{
          fontSize:
            11,
          marginBottom:
            5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            14,
          fontWeight:
            700,
          fontFamily:
            mono
              ? "monospace"
              : undefined,
          wordBreak:
            "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =====================================================
   ORDERS
===================================================== */

function OrdersTable({
  orders,
  onDelete,
}: {
  orders: AdminOrder[];

  onDelete: (
    order: AdminOrder
  ) => Promise<void>;
}) {
  return (
    <div
      className="card"
      style={{
        overflowX:
          "auto",
      }}
    >
      <div className="sec-header">
        <h2>
          Жүктер
        </h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Жүк</th>
            <th>
              Маршрут
            </th>
            <th>
              Жариялаған
            </th>
            <th>
              Телефон
            </th>
            <th>
              Статус
            </th>
            <th>Дата</th>
            <th>
              Әрекет
            </th>
          </tr>
        </thead>

        <tbody>
          {orders.map(
            (o) => (
              <tr
                key={o.id}
              >
                <td>
                  <b>
                    {
                      o.cargo_name
                    }
                  </b>

                  <div
                    className="text-muted"
                    style={{
                      fontSize:
                        12,
                    }}
                  >
                    {
                      o.vehicle_type
                    }{" "}
                    ·{" "}
                    {o.weight}{" "}
                    т ·{" "}
                    {o.volume}{" "}
                    м³
                  </div>
                </td>

                <td>
                  {
                    o.from_city
                  }{" "}
                  →{" "}
                  {
                    o.to_city
                  }
                </td>

                <td>
                  <b>
                    {o.owner
                      ?.full_name ||
                      "—"}
                  </b>

                  {o.owner
                    ?.company_name && (
                    <div
                      className="text-muted"
                      style={{
                        fontSize:
                          12,
                      }}
                    >
                      {
                        o.owner
                          .company_name
                      }
                    </div>
                  )}
                </td>

                <td>
                  {o.owner
                    ?.phone ||
                    o.contact_phone ||
                    "—"}
                </td>

                <td>
                  <span
                    className={`chip ${
                      o.status ===
                      "deleted"
                        ? "danger"
                        : "success"
                    }`}
                  >
                    {
                      o.status
                    }
                  </span>
                </td>

                <td>
                  {shortDate(
                    o.created_at
                  )}
                </td>

                <td>
                  <div
                    style={{
                      display:
                        "flex",
                      gap: 6,
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <button
                      className="btn ghost"
                      style={{
                        padding:
                          "6px 10px",
                        fontSize:
                          12,
                      }}
                      onClick={() =>
                        (location.href =
                          `/orders/${o.id}`)
                      }
                    >
                      Ашу
                    </button>

                    {o.status !==
                      "deleted" && (
                      <button
                        className="btn danger"
                        style={{
                          padding:
                            "6px 10px",
                          fontSize:
                            12,
                        }}
                        onClick={() =>
                          onDelete(
                            o
                          )
                        }
                      >
                        Өшіру
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          )}

          {orders.length ===
            0 && (
            <tr>
              <td
                colSpan={
                  7
                }
              >
                <div className="empty-state">
                  <h3>
                    Жүк жоқ
                  </h3>

                  <p>
                    Әлі ешкім
                    жүк
                    жарияламаған.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   COMPLAINTS
===================================================== */

function ComplaintsTable({
  complaints,
  onStatus,
  orders,
}: {
  complaints: any[];

  onStatus: (
    id: string,
    status:
      | "new"
      | "reviewed"
      | "closed"
  ) => Promise<void>;

  orders: AdminOrder[];
}) {
  return (
    <div
      className="card"
      style={{
        overflowX:
          "auto",
      }}
    >
      <div className="sec-header">
        <h2>
          Шағымдар
        </h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>
              Кім жіберді
            </th>
            <th>
              Неге қатысты
            </th>
            <th>
              Себеп
            </th>
            <th>
              Сипаттама
            </th>
            <th>
              Статус
            </th>
            <th>Дата</th>
            <th>
              Әрекет
            </th>
          </tr>
        </thead>

        <tbody>
          {complaints.map(
            (c) => {
              const relatedOrder =
                c.target_type ===
                "order"
                  ? orders.find(
                      (o) =>
                        o.id ===
                        c.target_id
                    )
                  : undefined;

              return (
                <tr
                  key={c.id}
                >
                  <td>
                    <b>
                      {c.user
                        ?.full_name ||
                        "—"}
                    </b>

                    <div
                      className="text-muted"
                      style={{
                        fontSize:
                          12,
                      }}
                    >
                      {c.user
                        ?.phone ||
                        "—"}
                    </div>
                  </td>

                  <td>
                    <b>
                      {
                        c.target_type
                      }
                    </b>{" "}
                    #
                    {String(
                      c.target_id
                    ).slice(
                      0,
                      8
                    )}

                    {relatedOrder && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize:
                            12,
                        }}
                      >
                        {
                          relatedOrder.cargo_name
                        }
                        :{" "}
                        {
                          relatedOrder.from_city
                        }{" "}
                        →{" "}
                        {
                          relatedOrder.to_city
                        }
                      </div>
                    )}
                  </td>

                  <td>
                    {
                      c.reason
                    }
                  </td>

                  <td>
                    {c.description ||
                      "—"}
                  </td>

                  <td>
                    <span
                      className={`chip ${
                        c.status ===
                        "closed"
                          ? "success"
                          : c.status ===
                              "reviewed"
                            ? "accent"
                            : "danger"
                      }`}
                    >
                      {
                        c.status
                      }
                    </span>
                  </td>

                  <td>
                    {shortDate(
                      c.created_at
                    )}
                  </td>

                  <td>
                    <div
                      style={{
                        display:
                          "flex",
                        flexWrap:
                          "wrap",
                        gap: 6,
                      }}
                    >
                      {c.status !==
                        "reviewed" && (
                        <button
                          className="btn ghost"
                          style={{
                            padding:
                              "6px 10px",
                            fontSize:
                              12,
                          }}
                          onClick={() =>
                            onStatus(
                              c.id,
                              "reviewed"
                            )
                          }
                        >
                          Қаралды
                        </button>
                      )}

                      {c.status !==
                        "closed" && (
                        <button
                          className="btn accent"
                          style={{
                            padding:
                              "6px 10px",
                            fontSize:
                              12,
                          }}
                          onClick={() =>
                            onStatus(
                              c.id,
                              "closed"
                            )
                          }
                        >
                          Жабу
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }
          )}

          {complaints.length ===
            0 && (
            <tr>
              <td
                colSpan={
                  7
                }
              >
                <div className="empty-state">
                  <h3>
                    Шағым жоқ
                  </h3>

                  <p>
                    Әзірге
                    шағым
                    түспеген.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   PAYMENTS
===================================================== */

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

  setRange: (
    r: Range
  ) => void;

  paymentGrowth: {
    day: string;
    label: string;
    amount: number;
  }[];

  maxPayment: number;
  revenue: number;
}) {
  return (
    <div
      style={{
        display:
          "flex",
        flexDirection:
          "column",
        gap: 16,
      }}
    >
      <RevenueChart
        range={
          range
        }
        setRange={
          setRange
        }
        paymentGrowth={
          paymentGrowth
        }
        maxPayment={
          maxPayment
        }
        revenue={
          revenue
        }
      />

      <div
        className="card"
        style={{
          overflowX:
            "auto",
        }}
      >
        <div className="sec-header">
          <h2>
            Төлем тарихы
          </h2>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>
                Аккаунт
              </th>
              <th>
                Телефон
              </th>
              <th>
                Тариф
              </th>
              <th>
                Сома
              </th>
              <th>
                Көзі
              </th>
              <th>
                Дата
              </th>
            </tr>
          </thead>

          <tbody>
            {payments.map(
              (p) => (
                <tr
                  key={
                    p.id
                  }
                >
                  <td>
                    <b>
                      {p.user
                        ?.full_name ||
                        "—"}
                    </b>

                    {p.user
                      ?.company_name && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize:
                            12,
                        }}
                      >
                        {
                          p.user
                            .company_name
                        }
                      </div>
                    )}
                  </td>

                  <td>
                    {p.user
                      ?.phone ||
                      "—"}
                  </td>

                  <td>
                    {
                      p.plan
                    }
                  </td>

                  <td>
                    <b>
                      {kzt(
                        Number(
                          p.amount ||
                            0
                        )
                      )}
                    </b>
                  </td>

                  <td>
                    {p.source ||
                      "admin"}
                  </td>

                  <td>
                    {shortDate(
                      p.created_at
                    )}
                  </td>
                </tr>
              )
            )}

            {payments.length ===
              0 && (
              <tr>
                <td
                  colSpan={
                    6
                  }
                >
                  <div className="empty-state">
                    <h3>
                      Түсім жоқ
                    </h3>

                    <p>
                      Бұл
                      периодта
                      төлем
                      тіркелмеген.
                    </p>
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

/* =====================================================
   LOGS
===================================================== */

function LogsTable({
  logs,
}: {
  logs: any[];
}) {
  return (
    <div
      className="card"
      style={{
        overflowX:
          "auto",
      }}
    >
      <div className="sec-header">
        <h2>
          Әкімшілік логтар
        </h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>
              Action
            </th>
            <th>
              Entity
            </th>
            <th>
              Date
            </th>
          </tr>
        </thead>

        <tbody>
          {logs.map(
            (log: any) => (
              <tr
                key={
                  log.id
                }
              >
                <td>
                  {
                    log.action
                  }
                </td>

                <td>
                  {log.entity_type ||
                    "—"}{" "}
                  #
                  {log.entity_id ||
                    "—"}
                </td>

                <td>
                  {shortDate(
                    log.created_at
                  )}
                </td>
              </tr>
            )
          )}

          {logs.length ===
            0 && (
            <tr>
              <td
                colSpan={
                  3
                }
              >
                <div className="empty-state">
                  <h3>
                    Лог жоқ
                  </h3>

                  <p>
                    Әзірге
                    әкімшілік
                    әрекеттер
                    тіркелмеген.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}