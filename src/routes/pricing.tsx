import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PricingCard } from "@/components/PricingCard";
import { useI18n } from "@/lib/i18n";
import { kzt } from "@/lib/format";
import { PLAN_PRICES, subscribe } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Тарифтер — ARGO" },
      { name: "description", content: "ARGO жазылым тарифтері. Жүргізушілерге айлық 4990₸, жылдық 49900₸. Жүк иелеріне тегін." },
      { property: "og:title", content: "Тарифтер — ARGO" },
      { property: "og:description", content: "Жүргізушілерге жазылым. Жүк иелеріне тегін." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const choose = (plan: "monthly" | "yearly") => {
  if (!user) {
    navigate({ to: "/auth" });
    return;
  }

  if (user.role !== "driver") {
    toast.info("Жүк иелеріне жазылым қажет емес");
    return;
  }

  navigate({ to: "/subscription", search: { plan } });
};

  const driverFeatures = [t("pricing.f1"), t("pricing.f2"), t("pricing.f3"), t("pricing.f4")];

  return (
    <AppShell width="medium">
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 className="page-title">{t("pricing.title")}</h1>
        <p className="page-sub" style={{ maxWidth: 480, margin: "6px auto 0" }}>{t("pricing.sub")}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
        <PricingCard
          title={t("pricing.free")}
          price={t("pricing.free")}
          features={[t("pricing.ownerFree"), t("home.findTruck")]}
          cta={t("pricing.freeDesc")}
          onSelect={() => navigate({ to: "/orders/new" })}
        />
        <PricingCard
          title={t("pricing.monthly")}
          price={kzt(PLAN_PRICES.monthly)}
          period={t("pricing.perMonth")}
          features={driverFeatures}
          cta={t("pricing.choose")}
          onSelect={() => choose("monthly")}
        />
        <PricingCard
          title={t("pricing.yearly")}
          price={kzt(PLAN_PRICES.yearly)}
          period={t("pricing.perYear")}
          features={[t("pricing.trial"), ...driverFeatures]}
          cta={t("pricing.choose")}
          best
          badge={t("pricing.best")}
          onSelect={() => choose("yearly")}
        />
      </div>
    </AppShell>
  );
}
