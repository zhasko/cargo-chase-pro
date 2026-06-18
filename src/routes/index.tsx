import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CargoCard } from "@/components/CargoCard";
import { TruckCard } from "@/components/TruckCard";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { listOrders, listTrucks } from "@/lib/services";
import { MOCK_USERS, CITIES } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARGO — Жүк пен тасымалдаушыны бір жерден табыңыз" },
      { name: "description", content: "Жүк иелері мен жүргізушілерге арналған заманауи логистика алаңы. Тікелей байланыс, комиссиясыз." },
      { property: "og:title", content: "ARGO — Логистика алаңы" },
      { property: "og:description", content: "Жүк және көлік іздеу. Бүкіл Қазақстан бойынша." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const orders = useQuery({ queryKey: ["orders", "latest"], queryFn: () => listOrders({ sort: "new" }) });
  const trucks = useQuery({ queryKey: ["trucks", "latest"], queryFn: () => listTrucks() });

  const quickSearch = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("argo_qs", JSON.stringify({ from, to }));
    }
    navigate({ to: "/orders" });
  };

  return (
    <AppShell>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon.sparkles style={{ width: 12, height: 12 }} /> {t("home.heroBadge")}
          </div>
          <h1>{t("home.heroTitle")}</h1>
          <p>{t("home.heroSub")}</p>
          <div className="hero-btns">
            <button className="hero-btn cta" onClick={() => navigate({ to: "/orders" })}>
              <Icon.package style={{ width: 16, height: 16 }} /> {t("home.findCargo")}
            </button>
            <button className="hero-btn outline" onClick={() => navigate({ to: "/orders/new" })}>
              <Icon.plus style={{ width: 16, height: 16 }} /> {t("home.publishCargo")}
            </button>
          </div>
        </div>
      </section>

      {/* Quick search */}
      <div className="quick-search" style={{ marginTop: 20 }}>
        <div className="quick-search-grid">
          <div className="qs-field">
            <Icon.mapPin style={{ width: 16, height: 16, color: "var(--muted)" }} />
            <input placeholder={`${t("common.from")}: Алматы`} value={from} onChange={(e) => setFrom(e.target.value)} list="qs-cities" />
          </div>
          <div className="qs-field">
            <Icon.mapPin style={{ width: 16, height: 16, color: "var(--muted)" }} />
            <input placeholder={`${t("common.to")}: Астана`} value={to} onChange={(e) => setTo(e.target.value)} list="qs-cities" />
          </div>
          <button className="btn primary qs-btn" onClick={quickSearch}>
            <Icon.filter style={{ width: 16, height: 16 }} /> {t("common.search")}
          </button>
        </div>
        <datalist id="qs-cities">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* Latest cargo */}
      <section style={{ marginTop: 32 }}>
        <div className="sec-header">
          <h2>{t("home.latestCargo")}</h2>
          <a onClick={() => navigate({ to: "/orders" })}>{t("home.seeAll")} →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {(orders.data ?? []).slice(0, 6).map((o) => (
            <CargoCard key={o.id} order={o} />
          ))}
        </div>
      </section>

      {/* Latest trucks */}
      <section style={{ marginTop: 32 }}>
        <div className="sec-header">
          <h2>{t("home.latestTrucks")}</h2>
          <a onClick={() => navigate({ to: "/trucks" })}>{t("home.seeAll")} →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {(trucks.data ?? []).slice(0, 3).map((tr) => (
            <TruckCard key={tr.id} truck={tr} driver={MOCK_USERS.find((u) => u.id === tr.driver_id)} />
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ marginTop: 32 }}>
        <div className="sec-header">
          <h2>{t("home.benefits")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {[
            { icon: Icon.zap, title: t("home.b1"), desc: t("home.b1d") },
            { icon: Icon.credit, title: t("home.b2"), desc: t("home.b2d") },
            { icon: Icon.truck, title: t("home.b3"), desc: t("home.b3d") },
          ].map((b, i) => (
            <div className="benefit-card" key={i}>
              <div className="benefit-icon">
                <b.icon />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 14 }}>{b.title}</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
