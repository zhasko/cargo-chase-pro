import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { CargoCard } from "@/components/CargoCard";
import { TruckCard } from "@/components/TruckCard";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { listOrders, listTrucks } from "@/lib/services";
import { MOCK_USERS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARGO — Жүк пен тасымалдаушыны бір жерден табыңыз" },
      {
        name: "description",
        content:
          "Жүк иелері мен жүргізушілерге арналған заманауи логистика алаңы. Тікелей байланыс, комиссиясыз.",
      },
      { property: "og:title", content: "ARGO — Логистика алаңы" },
      { property: "og:description", content: "Жүк және көлік іздеу. Бүкіл Қазақстан бойынша." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();

  const orders = useQuery({
    queryKey: ["orders", "latest"],
    queryFn: () => listOrders({ sort: "new" }),
  });

  const trucks = useQuery({
    queryKey: ["trucks", "latest"],
    queryFn: () => listTrucks(),
  });

  return (
    <AppShell>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon.sparkles style={{ width: 12, height: 12 }} />
            {t("home.heroBadge")}
          </div>

          <h1>{t("home.heroTitle")}</h1>
          <p>{t("home.heroSub")}</p>

          <div className="hero-btns">
            <Link to="/orders" className="hero-btn cta">
              <Icon.package style={{ width: 16, height: 16 }} />
              {t("home.findCargo")}
            </Link>

            <Link to="/orders/new" className="hero-btn outline">
              <Icon.plus style={{ width: 16, height: 16 }} />
              {t("home.publishCargo")}
            </Link>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="sec-header">
          <h2>{t("home.latestCargo")}</h2>

          <Link to="/orders">
            {t("home.seeAll")} →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {(orders.data ?? []).slice(0, 6).map((order) => (
            <CargoCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="sec-header">
          <h2>{t("home.latestTrucks")}</h2>

          <Link to="/trucks">
            {t("home.seeAll")} →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {(trucks.data ?? []).slice(0, 3).map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              driver={MOCK_USERS.find((user) => user.id === truck.driver_id)}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}