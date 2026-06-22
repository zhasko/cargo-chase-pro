import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { kzt, shortDate, daysUntil } from "@/lib/format";
import { getSubscription, PLAN_PRICES } from "@/lib/services";
import { useAuth } from "@/lib/store";

const ADMIN_WHATSAPP = "77000000000";

const PAYMENT_LINKS = {
  monthly: "https://kaspi.kz/pay/ARGO-MONTHLY",
  yearly: "https://kaspi.kz/pay/ARGO-YEARLY",
};

export const Route = createFileRoute("/subscription")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: search.plan === "yearly" ? "yearly" : "monthly",
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { plan } = Route.useSearch();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  const subscription = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => getSubscription(user!.id),
    enabled: !!user,
  });

  if (!user) return null;

  const selectedPlan = plan === "yearly" ? "yearly" : "monthly";
  const amount = selectedPlan === "yearly" ? PLAN_PRICES.yearly : PLAN_PRICES.monthly;
  const paymentLink = PAYMENT_LINKS[selectedPlan];

  const sub = subscription.data;
  const active = !!sub && sub.status === "active" && new Date(sub.expires_at).getTime() > Date.now();

  const whatsappText = encodeURIComponent(
    `Сәлеметсіз бе! Мен ARGO жазылымын төледім.\n` +
      `Аты-жөнім: ${user.full_name}\n` +
      `Телефон: ${user.phone}\n` +
      `Тариф: ${selectedPlan === "yearly" ? "Жылдық" : "Айлық"}\n` +
      `Сома: ${amount} ₸\n` +
      `Чекті осы чатқа жіберемін.`
  );

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${whatsappText}`;

  return (
    <AppShell width="narrow">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>
        ← Артқа
      </button>

      <h1 className="page-title">Жазылым</h1>
      <p className="page-sub">Төлем жасап, чекті WhatsApp арқылы админге жіберіңіз.</p>

      <div className={`sub-status ${active ? "active" : "expired"}`} style={{ marginTop: 18 }}>
        <b>{active ? "Жазылым белсенді" : "Жазылым жоқ"}</b>
        {sub && (
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Тариф: {sub.plan} · {shortDate(sub.expires_at)} · {daysUntil(sub.expires_at)} күн қалды
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>{selectedPlan === "yearly" ? "Жылдық жазылым" : "Айлық жазылым"}</h2>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>{kzt(amount)}</div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            className={`btn ${selectedPlan === "monthly" ? "primary" : "ghost"}`}
            onClick={() => navigate({ to: "/subscription", search: { plan: "monthly" } })}
          >
            Айлық
          </button>

          <button
            className={`btn ${selectedPlan === "yearly" ? "primary" : "ghost"}`}
            onClick={() => navigate({ to: "/subscription", search: { plan: "yearly" } })}
          >
            Жылдық
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <a className="btn primary" href={paymentLink} target="_blank" rel="noreferrer">
            Төлем бетіне өту
          </a>

          <a className="btn accent" href={whatsappUrl} target="_blank" rel="noreferrer">
            Чекті WhatsApp арқылы админге жіберу
          </a>
        </div>

        <p className="text-muted" style={{ fontSize: 12, marginTop: 14 }}>
          1) Төлем бетіне өтесіз. 2) Төлем жасайсыз. 3) Чекті WhatsApp-қа жібересіз.
          4) Админ жазылымды қолмен қосады.
        </p>
      </div>
    </AppShell>
  );
}