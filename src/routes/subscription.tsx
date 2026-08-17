import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

import {
  getSubscription,
  isSubscriptionActiveAsync,
} from "@/lib/services";

import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
});

type Plan = "monthly" | "yearly";

/* =========================================================
   COUNTDOWN
========================================================= */

function getTimeLeft(expiresAt?: string | null) {
  if (!expiresAt) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const difference =
    new Date(expiresAt).getTime() - Date.now();

  if (difference <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return {
    total: difference,
    days,
    hours,
    minutes,
    seconds,
  };
}

/* =========================================================
   FORMAT COUNTDOWN
========================================================= */

function Countdown({
  expiresAt,
}: {
  expiresAt?: string | null;
}) {
  const [timeLeft, setTimeLeft] =
    useState(() =>
      getTimeLeft(expiresAt)
    );

  useEffect(() => {
    const update = () => {
      setTimeLeft(
        getTimeLeft(expiresAt)
      );
    };

    update();

    const interval = window.setInterval(
      update,
      1000
    );

    return () =>
      window.clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || timeLeft.total <= 0) {
    return (
      <div className="argo-countdown expired">
        <span>Жазылым мерзімі аяқталды</span>
      </div>
    );
  }

  return (
    <div className="argo-countdown">
      <div className="countdown-title">
        АЯҚТАЛУЫНА ҚАЛҒАН УАҚЫТ
      </div>

      <div className="countdown-grid">
        <CountdownBox
          value={timeLeft.days}
          label="күн"
        />

        <span className="countdown-colon">
          :
        </span>

        <CountdownBox
          value={timeLeft.hours}
          label="сағ"
        />

        <span className="countdown-colon">
          :
        </span>

        <CountdownBox
          value={timeLeft.minutes}
          label="мин"
        />

        <span className="countdown-colon">
          :
        </span>

        <CountdownBox
          value={timeLeft.seconds}
          label="сек"
        />
      </div>

      <div className="countdown-date">
        {new Date(
          expiresAt
        ).toLocaleDateString(
          "kk-KZ",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        )}{" "}
        дейін
      </div>
    </div>
  );
}

/* =========================================================
   COUNTDOWN BOX
========================================================= */

function CountdownBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="countdown-box">
      <strong>
        {String(value).padStart(2, "0")}
      </strong>

      <span>{label}</span>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

function SubscriptionPage() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const { t } = useI18n();

  const [selectedPlan, setSelectedPlan] =
    useState<Plan>("monthly");

  const [paymentOpen, setPaymentOpen] =
    useState<Plan | null>(null);

  const [busy, setBusy] =
    useState(false);

  /* =======================================================
     PRICES
  ======================================================= */

  const monthlyOldPrice = 9990;
  const monthlyPrice = 4990;

  const yearlyOldPrice = 119880;
  const yearlyPrice = 59900;

  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  const {
    data: subscription,
    isLoading: subscriptionLoading,
  } = useQuery({
    queryKey: [
      "subscription",
      user?.id,
    ],

    queryFn: () =>
      getSubscription(user!.id),

    enabled: !!user,

    refetchInterval: 30000,
  });

  const {
    data: hasActiveSubscription = false,
  } = useQuery({
    queryKey: [
      "subscription-active",
      user?.id,
    ],

    queryFn: () =>
      isSubscriptionActiveAsync(
        user!.id
      ),

    enabled: !!user,

    refetchInterval: 30000,
  });

  /* =======================================================
     ACTIVE PLAN
  ======================================================= */

  const activePlan = useMemo<
    "base" | "monthly" | "yearly"
  >(() => {
    if (
      !hasActiveSubscription ||
      !subscription
    ) {
      return "base";
    }

    /*
      TRIAL = MONTHLY
      Себебі жаңа қолданушыға
      автоматты түрде 30 күн беріледі.
    */

    if (
      subscription.plan === "trial"
    ) {
      return "monthly";
    }

    if (
      subscription.plan === "yearly"
    ) {
      return "yearly";
    }

    if (
      subscription.plan === "monthly"
    ) {
      return "monthly";
    }

    return "base";
  }, [
    hasActiveSubscription,
    subscription,
  ]);

  const activeExpiresAt =
    subscription?.expires_at ??
    null;

  /* =======================================================
     LOGIN
  ======================================================= */

  if (!user) {
    return (
      <AppShell width="medium">
        <div className="subscription-login">
          <div className="subscription-login-icon">
            A
          </div>

          <h2>
            ARGO жазылымы
          </h2>

          <p>
            Жазылымды басқару үшін
            аккаунтыңызға кіріңіз.
          </p>

          <button
            className="argo-primary-btn"
            onClick={() =>
              navigate({
                to: "/auth",
              })
            }
          >
            {t("common.login")}
          </button>
        </div>

        <SubscriptionStyles />
      </AppShell>
    );
  }

  /* =======================================================
     WHATSAPP PAYMENT
  ======================================================= */

  const sendPaymentRequest = (
    plan: Plan
  ) => {
    if (!user) {
      navigate({
        to: "/auth",
      });

      return;
    }

    if (!user.public_id) {
      toast.error(
        "Клиент ID табылмады. Профильді жаңартыңыз."
      );

      return;
    }

    const price =
      plan === "yearly"
        ? yearlyPrice
        : monthlyPrice;

    const planName =
      plan === "yearly"
        ? "Жылдық"
        : "Айлық";

    const whatsappText =
      encodeURIComponent(
        `Сәлеметсіз бе! ARGO жазылымын сатып алдым.\n\n` +
          `Клиент ID: ${user.public_id}\n` +
          `Аты-жөнім: ${user.full_name}\n` +
          `Телефон: ${user.phone}\n` +
          `Тариф: ${planName}\n` +
          `Сома: ${price.toLocaleString(
            "kk-KZ"
          )} ₸\n\n` +
          `Чекті осы чатқа жіберемін.`
      );

    const adminWhatsApp =
      "77011250468";

    const url =
      `https://wa.me/${adminWhatsApp}` +
      `?text=${whatsappText}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =======================================================
     PAYMENT OPEN
  ======================================================= */

  const openPayment = (
    plan: Plan
  ) => {
    setSelectedPlan(plan);

    setPaymentOpen(
      paymentOpen === plan
        ? null
        : plan
    );
  };

  /* =======================================================
     PLAN CARD
  ======================================================= */

  const PlanCard = ({
    plan,
    title,
    oldPrice,
    price,
    period,
    discount,
    description,
    popular,
  }: {
    plan: Plan;
    title: string;
    oldPrice?: number;
    price: number;
    period: string;
    discount?: string;
    description: string;
    popular?: boolean;
  }) => {
    const isActive =
      activePlan === plan;

    const isSelected =
      selectedPlan === plan;

    const isPaymentOpen =
      paymentOpen === plan;

    /*
      Егер тариф белсенді болса,
      сатып алу батырмасын көрсетпейміз.
    */

    return (
      <div
        className={[
          "argo-plan-card",
          isSelected
            ? "selected"
            : "",
          isActive
            ? "active-plan"
            : "",
          popular
            ? "popular"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() =>
          setSelectedPlan(plan)
        }
      >
        {/* =================================================
            ACTIVE BADGE
        ================================================= */}

        {isActive && (
          <div className="active-plan-badge">
            <span className="active-check">
              ✓
            </span>

            СІЗДІҢ ЖАЗЫЛЫМЫҢЫЗ
          </div>
        )}

        {/* =================================================
            POPULAR
        ================================================= */}

        {popular && !isActive && (
          <div className="argo-popular-badge">
            ЕҢ ТИІМДІ
          </div>
        )}

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="argo-plan-top">
          <div className="argo-plan-heading">
            <div className="argo-plan-title">
              {title}
            </div>

            <div className="argo-plan-description">
              {description}
            </div>
          </div>

          {discount && (
            <span className="argo-discount">
              {discount}
            </span>
          )}
        </div>

        {/* =================================================
            PRICE
        ================================================= */}

        <div className="argo-price-block">
          {oldPrice && (
            <div className="argo-old-price">
              {oldPrice.toLocaleString(
                "kk-KZ"
              )}{" "}
              ₸
            </div>
          )}

          <div className="argo-new-price">
            {price.toLocaleString(
              "kk-KZ"
            )}{" "}
            ₸
          </div>

          <div className="argo-period">
            {period}
          </div>
        </div>

        {/* =================================================
            SAVE
        ================================================= */}

        {oldPrice && (
          <div className="argo-save">
            <span>✓</span>

            Үнемдейсіз{" "}
            {(
              oldPrice - price
            ).toLocaleString(
              "kk-KZ"
            )}{" "}
            ₸
          </div>
        )}

        {/* =================================================
            COUNTDOWN
        ================================================= */}

        {isActive &&
          activeExpiresAt && (
            <Countdown
              expiresAt={
                activeExpiresAt
              }
            />
          )}

        {/* =================================================
            FEATURES
        ================================================= */}

        <div className="argo-features">
          <Feature>
            Жүк иесінің телефон нөмірін көру
          </Feature>

          <Feature>
            Жүк мекенжайын көру
          </Feature>

          <Feature>
            Жүргізушілерге арналған толық мүмкіндіктер
          </Feature>

          <Feature>
            ARGO-ның барлық негізгі мүмкіндіктері
          </Feature>
        </div>

        {/* =================================================
            BUTTON
        ================================================= */}

        {!isActive && (
          <button
            type="button"
            className="argo-plan-button"
            onClick={(e) => {
              e.stopPropagation();

              openPayment(plan);
            }}
          >
            <span>
              {isPaymentOpen
                ? "Төлемді жабу"
                : "Жазылымды алу"}
            </span>

            <span className="button-arrow">
              {isPaymentOpen
                ? "↑"
                : "→"}
            </span>
          </button>
        )}

        {/* =================================================
            ACTIVE STATE
        ================================================= */}

        {isActive && (
          <div className="active-plan-footer">
            <span className="active-footer-dot" />

            Қазіргі уақытта белсенді
          </div>
        )}

        {/* =================================================
            PAYMENT
        ================================================= */}

        {isPaymentOpen &&
          !isActive && (
            <div
              className="argo-payment-panel"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="argo-payment-title">
                Төлем әдісін таңдаңыз
              </div>

              <div className="argo-payment-sub">
                {title} жазылымы ·{" "}
                {price.toLocaleString(
                  "kk-KZ"
                )}{" "}
                ₸
              </div>

              <div className="argo-payment-methods">

                {/* KASPI */}

                <a
                  href="https://kaspi.kz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="argo-payment-option kaspi"
                >
                  <div className="payment-logo kaspi-logo">
                    <img
                      src="/kaspi-logo.png"
                      alt="Kaspi"
                    />
                  </div>

                  <div className="payment-option-text">
                    <strong>
                      Kaspi арқылы төлеу
                    </strong>

                    <span>
                      Kaspi қосымшасына өту
                    </span>
                  </div>

                  <div className="payment-arrow">
                    →
                  </div>
                </a>

                {/* WHATSAPP */}

                <button
                  type="button"
                  className="argo-payment-option whatsapp"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);

                    try {
                      sendPaymentRequest(
                        plan
                      );
                    } finally {
                      setTimeout(
                        () =>
                          setBusy(
                            false
                          ),
                        500
                      );
                    }
                  }}
                >
                  <div className="payment-logo whatsapp-logo">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M20.5 3.5A11.9 11.9 0 0 0 12.05 0C5.48 0 .13 5.34.13 11.92c0 2.1.55 4.15 1.59 5.95L.02 24l6.27-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.19-1.24-6.19-3.48-8.41ZM12.06 21.85h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.87 9.87 0 0 1-1.51-5.31c0-5.48 4.46-9.94 9.95-9.94 2.66 0 5.16 1.04 7.04 2.92a9.9 9.9 0 0 1 2.91 7.05c0 5.48-4.46 9.94-9.94 9.94Zm5.45-7.45c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.69.15-.2.3-.79.98-.97 1.18-.18.2-.36.22-.66.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.03-.17-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.65-.94-2.26-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.53.08-.81.38-.28.3-1.06 1.04-1.06 2.54s1.09 2.95 1.24 3.15c.15.2 2.14 3.27 5.19 4.58.73.31 1.3.5 1.74.64.73.23 1.4.2 1.93.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35Z"
                      />
                    </svg>
                  </div>

                  <div className="payment-option-text">
                    <strong>
                      Чекті жіберу
                    </strong>

                    <span>
                      WhatsApp арқылы менеджерге
                    </span>
                  </div>

                  <div className="payment-arrow">
                    →
                  </div>
                </button>
              </div>

              <div className="argo-payment-note">
                <div className="payment-info-icon">
                  i
                </div>

                <div>
                  Алдымен Kaspi арқылы
                  төлем жасаңыз. Содан кейін
                  чекті WhatsApp арқылы
                  менеджерге жіберіңіз.
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <AppShell width="medium">
      <div className="subscription-page">

        {/* BACK */}

        <button
          className="subscription-back"
          onClick={() =>
            navigate({
              to: "/",
            })
          }
        >
          <span>←</span>

          {t("common.back")}
        </button>

        {/* HEADER */}

        <div className="subscription-header">
          <div className="subscription-eyebrow">
            ARGO PREMIUM
          </div>

          <h1>
            Жазылым
          </h1>

          <p>
            ARGO-ның толық мүмкіндіктерін
            пайдаланыңыз.
          </p>
        </div>

        {/* =================================================
            ACTIVE PLAN HEADER
        ================================================= */}

        {!subscriptionLoading && (
          <div className="active-summary">
            <div className="active-summary-icon">
              ✓
            </div>

            <div className="active-summary-text">
              <div className="active-summary-label">
                БЕЛСЕНДІ ТАРИФ
              </div>

              <div className="active-summary-title">
                {activePlan === "base"
                  ? "Базалық"
                  : activePlan ===
                    "monthly"
                  ? "Айлық"
                  : "Жылдық"}
              </div>
            </div>

            <div className="active-summary-status">
              <span />

              Белсенді
            </div>
          </div>
        )}

        {/* =================================================
            PLANS HEADER
        ================================================= */}

        <div className="plans-header">
          <div>
            <h2>
              Белсенді тариф
            </h2>

            <span>
              Қазіргі уақытта қолданылып тұрған жазылым
            </span>
          </div>
        </div>

        {/* =================================================
            PLANS
        ================================================= */}

        <div className="argo-plans">

          {/* =================================================
              BASE
          ================================================= */}

          <div
            className={[
              "argo-plan-card",
              "base",
              activePlan === "base"
                ? "active-plan"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* ACTIVE BADGE */}

            {activePlan === "base" && (
              <div className="active-plan-badge">
                <span className="active-check">
                  ✓
                </span>

                СІЗДІҢ ЖАЗЫЛЫМЫҢЫЗ
              </div>
            )}

            <div className="argo-plan-top">
              <div className="argo-plan-heading">
                <div className="argo-plan-title">
                  Базалық
                </div>

                <div className="argo-plan-description">
                  Негізгі мүмкіндіктер
                </div>
              </div>

              <span className="base-badge">
                FREE
              </span>
            </div>

            <div className="argo-price-block">
              <div className="argo-new-price">
                0 ₸
              </div>

              <div className="argo-period">
                әрқашан
              </div>
            </div>

            <div className="argo-features">
              <Feature>
                Жүк жариялау
              </Feature>

              <Feature>
                Жүк іздеу
              </Feature>

              <Feature>
                Профильді пайдалану
              </Feature>

              <Feature muted>
                Жүк иесінің нөмірін көру
              </Feature>
            </div>

            {activePlan === "base" ? (
              <div className="active-plan-footer">
                <span className="active-footer-dot" />

                Қазіргі уақытта белсенді
              </div>
            ) : (
              <div className="base-inactive">
                Базалық жоспар
              </div>
            )}
          </div>

          {/* =================================================
              MONTHLY
          ================================================= */}

          <PlanCard
            plan="monthly"
            title="Айлық"
            oldPrice={
              monthlyOldPrice
            }
            price={
              monthlyPrice
            }
            period="30 күн"
            discount="-50%"
            description="Ай сайынғы толық қолжетімділік"
          />

          {/* =================================================
              YEARLY
          ================================================= */}

          <PlanCard
            plan="yearly"
            title="Жылдық"
            oldPrice={
              yearlyOldPrice
            }
            price={
              yearlyPrice
            }
            period="365 күн"
            discount="-50%"
            description="Жыл бойы тиімді пайдалану"
            popular
          />
        </div>

        {/* =================================================
            INSTRUCTION
        ================================================= */}

        <div className="instruction">

          <div className="instruction-header">
            <div className="instruction-icon">
              ?
            </div>

            <div>
              <h3>
                Қалай жазылым алуға болады?
              </h3>

              <p>
                Бар болғаны 3 қадам
              </p>
            </div>
          </div>

          <div className="instruction-steps">

            <div className="instruction-step">
              <div className="step-number">
                01
              </div>

              <div>
                <strong>
                  Тарифті таңдаңыз
                </strong>

                <span>
                  Айлық немесе жылдық
                  жазылымды таңдаңыз.
                </span>
              </div>
            </div>

            <div className="instruction-line" />

            <div className="instruction-step">
              <div className="step-number">
                02
              </div>

              <div>
                <strong>
                  Kaspi арқылы төлеңіз
                </strong>

                <span>
                  «Жазылымды алу» батырмасын
                  басып, Kaspi-ге өтіңіз.
                </span>
              </div>
            </div>

            <div className="instruction-line" />

            <div className="instruction-step">
              <div className="step-number">
                03
              </div>

              <div>
                <strong>
                  Чекті менеджерге жіберіңіз
                </strong>

                <span>
                  WhatsApp арқылы чекті
                  жіберіңіз. Менеджер төлемді
                  тексеріп, жазылымды
                  белсендіреді.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}

        <div className="subscription-footer">
          ARGO · Қауіпсіз төлем ·
          Менеджер арқылы растау
        </div>
      </div>

      <SubscriptionStyles />
    </AppShell>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={
        muted
          ? "argo-feature muted"
          : "argo-feature"
      }
    >
      <span>
        {muted ? "×" : "✓"}
      </span>

      <div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

function SubscriptionStyles() {
  return (
    <style>{`

      /* =====================================================
         PAGE
      ===================================================== */

      .subscription-page {
        width: 100%;
        max-width: 980px;

        margin: 0 auto;

        padding:
          28px 0 48px;

        color: #102A43;
      }


      /* =====================================================
         LOGIN
      ===================================================== */

      .subscription-login {
        width: 100%;
        max-width: 460px;

        margin: 70px auto;

        padding: 42px 30px;

        text-align: center;

        border-radius: 24px;

        background: #ffffff;

        border:
          1px solid
          #d9e2ec;

        box-shadow:
          0 18px 50px
          rgba(16,42,67,.10);
      }

      .subscription-login-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 58px;
        height: 58px;

        margin:
          0 auto 18px;

        border-radius: 17px;

        background: #102A43;

        color: #C0E040;

        font-size: 24px;
        font-weight: 950;
      }

      .subscription-login h2 {
        margin: 0;

        color: #102A43;

        font-size: 25px;
        font-weight: 950;
      }

      .subscription-login p {
        margin:
          10px 0 22px;

        color: #627d98;

        font-size: 14px;
        line-height: 1.6;
      }

      .argo-primary-btn {
        width: 100%;
        height: 48px;

        border: 0;

        border-radius: 12px;

        background: #C0E040;

        color: #102A43;

        font-size: 13px;
        font-weight: 950;

        cursor: pointer;
      }


      /* =====================================================
         BACK
      ===================================================== */

      .subscription-back {
        display: inline-flex;
        align-items: center;

        gap: 8px;

        margin-bottom: 26px;

        padding: 0;

        border: 0;

        background:
          transparent;

        color: #486581;

        font-size: 13px;
        font-weight: 800;

        cursor: pointer;

        transition:
          color .18s ease,
          transform .18s ease;
      }

      .subscription-back span {
        font-size: 18px;
      }

      .subscription-back:hover {
        color: #102A43;

        transform:
          translateX(-2px);
      }


      /* =====================================================
         HEADER
      ===================================================== */

      .subscription-header {
        margin-bottom: 25px;
      }

      .subscription-eyebrow {
        display: inline-flex;
        align-items: center;

        margin-bottom: 11px;

        padding:
          6px 10px;

        border:
          1px solid
          rgba(16,42,67,.12);

        border-radius: 999px;

        background:
          rgba(16,42,67,.045);

        color: #102A43;

        font-size: 9px;
        font-weight: 950;

        letter-spacing:
          .14em;
      }

      .subscription-header h1 {
        margin: 0;

        color: #102A43;

        font-size:
          clamp(34px, 5vw, 48px);

        line-height: 1;

        font-weight: 950;

        letter-spacing:
          -1.8px;
      }

      .subscription-header p {
        margin:
          11px 0 0;

        color: #627D98;

        font-size: 14px;

        line-height: 1.6;
      }


      /* =====================================================
         ACTIVE SUMMARY
      ===================================================== */

      .active-summary {
        display: flex;
        align-items: center;

        gap: 13px;

        margin-bottom: 28px;

        padding:
          15px 17px;

        border:
          1px solid
          rgba(192,224,64,.60);

        border-radius: 16px;

        background:
          linear-gradient(
            135deg,
            rgba(192,224,64,.18),
            rgba(192,224,64,.06)
          );

        box-shadow:
          0 8px 25px
          rgba(16,42,67,.06);
      }

      .active-summary-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 38px;
        height: 38px;

        flex-shrink: 0;

        border-radius: 11px;

        background: #C0E040;

        color: #102A43;

        font-size: 17px;
        font-weight: 950;

        box-shadow:
          0 5px 16px
          rgba(192,224,64,.30);
      }

      .active-summary-text {
        min-width: 0;

        flex: 1;
      }

      .active-summary-label {
        color: #657786;

        font-size: 8px;
        font-weight: 950;

        letter-spacing:
          .13em;
      }

      .active-summary-title {
        margin-top: 2px;

        color: #102A43;

        font-size: 16px;
        font-weight: 950;
      }

      .active-summary-status {
        display: inline-flex;
        align-items: center;

        gap: 7px;

        flex-shrink: 0;

        padding:
          7px 10px;

        border:
          1px solid
          rgba(145,179,38,.35);

        border-radius: 999px;

        background:
          rgba(192,224,64,.16);

        color: #3B4D10;

        font-size: 9px;
        font-weight: 950;
      }

      .active-summary-status span {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #91B326;

        box-shadow:
          0 0 0 4px
          rgba(192,224,64,.17);
      }


      /* =====================================================
         PLANS HEADER
      ===================================================== */

      .plans-header {
        display: flex;
        align-items: flex-end;

        margin-bottom: 16px;
      }

      .plans-header h2 {
        margin: 0;

        color: #102A43;

        font-size: 22px;

        line-height: 1.2;

        font-weight: 950;

        letter-spacing: -.4px;
      }

      .plans-header span {
        display: block;

        margin-top: 5px;

        color: #627D98;

        font-size: 11px;

        font-weight: 600;
      }


      /* =====================================================
         GRID
      ===================================================== */

      .argo-plans {
        display: grid;

        grid-template-columns:
          repeat(3, minmax(0, 1fr));

        gap: 15px;

        align-items: stretch;
      }


      /* =====================================================
         CARD
      ===================================================== */

      .argo-plan-card {
        position: relative;

        display: flex;

        flex-direction: column;

        min-width: 0;

        padding: 21px;

        border:
          1px solid
          rgba(255,255,255,.08);

        border-radius: 20px;

        background:
          linear-gradient(
            145deg,
            #1D2530 0%,
            #121923 100%
          );

        color: #ffffff;

        box-shadow:
          0 13px 35px
          rgba(16,42,67,.18);

        cursor: pointer;

        transition:
          transform .2s ease,
          border-color .2s ease,
          box-shadow .2s ease;
      }

      .argo-plan-card:hover {
        transform:
          translateY(-3px);

        border-color:
          rgba(192,224,64,.30);

        box-shadow:
          0 20px 42px
          rgba(16,42,67,.25);
      }


      /* =====================================================
         ACTIVE PLAN
      ===================================================== */

      .argo-plan-card.active-plan {
        border:
          2px solid
          #C0E040;

        box-shadow:
          0 0 0 4px
          rgba(192,224,64,.13),

          0 20px 48px
          rgba(16,42,67,.28);

        background:
          linear-gradient(
            145deg,
            #26302A 0%,
            #111A17 100%
          );
      }

      .argo-plan-card.active-plan:hover {
        transform:
          translateY(-2px);

        border-color:
          #C0E040;
      }


      /* =====================================================
         ACTIVE BADGE
      ===================================================== */

      .active-plan-badge {
        position: absolute;

        top: -13px;
        left: 18px;

        display: inline-flex;
        align-items: center;

        gap: 6px;

        padding:
          7px 11px;

        border-radius: 8px;

        background: #C0E040;

        color: #102A43;

        font-size: 9px;

        font-weight: 950;

        letter-spacing:
          .025em;

        box-shadow:
          0 7px 20px
          rgba(192,224,64,.28);

        z-index: 2;
      }

      .active-check {
        display: inline-flex;

        align-items: center;
        justify-content: center;

        width: 15px;
        height: 15px;

        border-radius: 50%;

        background: #102A43;

        color: #C0E040;

        font-size: 9px;
      }


      /* =====================================================
         POPULAR
      ===================================================== */

      .argo-popular-badge {
        position: absolute;

        top: -11px;
        left: 20px;

        padding:
          6px 10px;

        border-radius: 7px;

        background: #C0E040;

        color: #102A43;

        font-size: 9px;

        font-weight: 950;

        letter-spacing: .04em;

        box-shadow:
          0 7px 20px
          rgba(192,224,64,.20);
      }


      /* =====================================================
         PLAN TOP
      ===================================================== */

      .argo-plan-top {
        display: flex;

        align-items:
          flex-start;

        justify-content:
          space-between;

        gap: 12px;

        min-height: 58px;
      }

      .argo-plan-heading {
        min-width: 0;

        flex: 1;
      }

      .argo-plan-title {
        color: #ffffff;

        font-size: 19px;

        line-height: 1.2;

        font-weight: 950;

        letter-spacing: -.3px;
      }

      .argo-plan-description {
        margin-top: 6px;

        color: #B7C2CE;

        font-size: 11px;

        line-height: 1.45;
      }


      /* =====================================================
         DISCOUNT
      ===================================================== */

      .argo-discount,
      .base-badge {
        flex-shrink: 0;

        padding:
          7px 10px;

        border-radius: 7px;

        font-size: 10px;

        line-height: 1;

        font-weight: 950;
      }

      .argo-discount {
        min-width: 44px;

        display: inline-flex;

        align-items: center;

        justify-content: center;

        background: #C0E040;

        color: #102A43;

        box-shadow:
          0 5px 14px
          rgba(192,224,64,.13);
      }

      .base-badge {
        border:
          1px solid
          rgba(255,255,255,.12);

        background:
          rgba(255,255,255,.055);

        color: #C8D2DC;
      }


      /* =====================================================
         PRICE
      ===================================================== */

      .argo-price-block {
        margin-top: 20px;
      }

      .argo-old-price {
        min-height: 18px;

        color: #718096;

        font-size: 12px;

        font-weight: 700;

        text-decoration:
          line-through;
      }

      .argo-new-price {
        margin-top: 2px;

        color: #ffffff;

        font-size: 30px;

        line-height: 1.05;

        font-weight: 950;

        letter-spacing: -1.2px;
      }

      .argo-period {
        margin-top: 5px;

        color: #9FB0BF;

        font-size: 11px;

        font-weight: 600;
      }


      /* =====================================================
         SAVE
      ===================================================== */

      .argo-save {
        display: flex;

        align-items: center;

        gap: 6px;

        margin-top: 12px;

        color: #C0E040;

        font-size: 10.5px;

        font-weight: 850;
      }

      .argo-save span {
        color: #C0E040;

        font-weight: 950;
      }


      /* =====================================================
         COUNTDOWN
      ===================================================== */

      .argo-countdown {
        margin-top: 18px;

        padding:
          12px;

        border:
          1px solid
          rgba(192,224,64,.24);

        border-radius: 12px;

        background:
          rgba(192,224,64,.07);
      }

      .argo-countdown.expired {
        color: #F87171;

        border-color:
          rgba(248,113,113,.20);

        background:
          rgba(248,113,113,.06);
      }

      .countdown-title {
        color: #A8B7A2;

        font-size: 7px;

        font-weight: 950;

        letter-spacing:
          .13em;

        text-align: center;
      }

      .countdown-grid {
        display: flex;

        align-items: center;

        justify-content: center;

        gap: 4px;

        margin-top: 7px;
      }

      .countdown-box {
        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        min-width: 38px;

        padding:
          5px 4px;

        border-radius: 7px;

        background:
          rgba(0,0,0,.20);
      }

      .countdown-box strong {
        color: #C0E040;

        font-size: 16px;

        line-height: 1;

        font-weight: 950;

        font-variant-numeric:
          tabular-nums;
      }

      .countdown-box span {
        margin-top: 3px;

        color: #829487;

        font-size: 6px;

        font-weight: 800;
      }

      .countdown-colon {
        color: #C0E040;

        font-size: 13px;

        font-weight: 950;

        margin-top: -6px;
      }

      .countdown-date {
        margin-top: 7px;

        color: #91A394;

        text-align: center;

        font-size: 8px;

        font-weight: 700;
      }


      /* =====================================================
         FEATURES
      ===================================================== */

      .argo-features {
        display: flex;

        flex-direction: column;

        gap: 11px;

        margin-top: 22px;

        padding-top: 18px;

        border-top:
          1px solid
          rgba(255,255,255,.08);
      }

      .argo-feature {
        display: flex;

        align-items:
          flex-start;

        gap: 9px;

        color: #F0F4F7;

        font-size: 11.5px;

        line-height: 1.45;
      }

      .argo-feature span {
        display: inline-flex;

        align-items: center;

        justify-content: center;

        width: 17px;
        height: 17px;

        flex-shrink: 0;

        margin-top: 1px;

        border-radius: 50%;

        background:
          rgba(192,224,64,.11);

        color: #C0E040;

        font-size: 9px;

        font-weight: 950;
      }

      .argo-feature.muted {
        color: #687687;
      }

      .argo-feature.muted span {
        background:
          rgba(255,255,255,.045);

        color: #667383;
      }


      /* =====================================================
         PLAN BUTTON
      ===================================================== */

      .argo-plan-button {
        display: flex;

        align-items: center;

        justify-content:
          space-between;

        width: 100%;

        min-height: 46px;

        margin-top: 22px;

        padding:
          0 14px;

        border: 0;

        border-radius: 11px;

        background: #C0E040;

        color: #102A43;

        font-size: 12px;

        font-weight: 950;

        cursor: pointer;

        transition:
          transform .18s ease,
          filter .18s ease,
          box-shadow .18s ease;
      }

      .argo-plan-button:hover {
        transform:
          translateY(-1px);

        filter:
          brightness(1.04);

        box-shadow:
          0 9px 22px
          rgba(192,224,64,.20);
      }

      .argo-plan-button:active {
        transform:
          translateY(0);
      }

      .button-arrow {
        font-size: 17px;

        font-weight: 900;
      }


      /* =====================================================
         ACTIVE FOOTER
      ===================================================== */

      .active-plan-footer {
        display: flex;

        align-items: center;

        justify-content: center;

        gap: 7px;

        width: 100%;

        box-sizing: border-box;

        margin-top: 22px;

        padding:
          12px;

        border:
          1px solid
          rgba(192,224,64,.20);

        border-radius: 11px;

        background:
          rgba(192,224,64,.07);

        color: #C0E040;

        text-align: center;

        font-size: 10.5px;

        font-weight: 900;
      }

      .active-footer-dot {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #C0E040;

        box-shadow:
          0 0 0 4px
          rgba(192,224,64,.10);
      }

      .base-inactive {
        width: 100%;

        box-sizing: border-box;

        margin-top: 22px;

        padding: 12px;

        border:
          1px solid
          rgba(255,255,255,.08);

        border-radius: 11px;

        background:
          rgba(255,255,255,.035);

        color: #7F8C99;

        text-align: center;

        font-size: 10.5px;

        font-weight: 800;
      }


      /* =====================================================
         PAYMENT
      ===================================================== */

      .argo-payment-panel {
        width: 100%;

        min-width: 0;

        margin-top: 14px;

        padding: 15px;

        box-sizing: border-box;

        border:
          1px solid
          rgba(255,255,255,.10);

        border-radius: 15px;

        background: #0D141D;

        animation:
          paymentOpen .2s ease;
      }

      @keyframes paymentOpen {
        from {
          opacity: 0;

          transform:
            translateY(-5px);
        }

        to {
          opacity: 1;

          transform:
            translateY(0);
        }
      }

      .argo-payment-title {
        color: #ffffff;

        font-size: 13px;

        font-weight: 950;
      }

      .argo-payment-sub {
        margin-top: 4px;

        margin-bottom: 12px;

        color: #9FB0BF;

        font-size: 10px;
      }

      .argo-payment-methods {
        display: flex;

        flex-direction: column;

        gap: 8px;

        width: 100%;
      }


      /* =====================================================
         PAYMENT OPTION
      ===================================================== */

      .argo-payment-option {
        display: flex;

        align-items: center;

        gap: 10px;

        width: 100%;

        min-width: 0;

        min-height: 52px;

        box-sizing: border-box;

        padding: 9px;

        border-radius: 11px;

        text-decoration: none;

        cursor: pointer;

        transition:
          transform .18s ease,
          border-color .18s ease,
          background .18s ease;
      }

      .argo-payment-option:hover {
        transform:
          translateY(-1px);
      }


      /* =====================================================
         KASPI
      ===================================================== */

      .argo-payment-option.kaspi {
        border:
          1px solid
          rgba(192,224,64,.20);

        background:
          rgba(192,224,64,.075);

        color: #ffffff;
      }

      .argo-payment-option.kaspi:hover {
        border-color:
          rgba(192,224,64,.42);

        background:
          rgba(192,224,64,.10);
      }


      /* =====================================================
         WHATSAPP
      ===================================================== */

      .argo-payment-option.whatsapp {
        border:
          1px solid
          rgba(255,255,255,.09);

        background:
          rgba(255,255,255,.035);

        color: #ffffff;
      }

      .argo-payment-option.whatsapp:hover {
        border-color:
          rgba(255,255,255,.18);

        background:
          rgba(255,255,255,.055);
      }


      /* =====================================================
         PAYMENT LOGOS
      ===================================================== */

      .payment-logo {
        display: flex;

        align-items: center;

        justify-content: center;

        width: 34px;
        height: 34px;

        flex-shrink: 0;

        border-radius: 9px;
      }

      .kaspi-logo {
        background: #C0E040;

        color: #102A43;
      }

      .kaspi-logo img {
        width: 100%;
        height: 100%;

        object-fit: contain;

        border-radius: 8px;
      }

      .whatsapp-logo {
        background: #25D366;

        color: #ffffff;
      }

      .whatsapp-logo svg {
        width: 21px;
        height: 21px;

        display: block;

        fill: currentColor;
      }


      /* =====================================================
         PAYMENT TEXT
      ===================================================== */

      .payment-option-text {
        display: flex;

        flex-direction: column;

        align-items:
          flex-start;

        min-width: 0;

        flex: 1;
      }

      .payment-option-text strong {
        display: block;

        max-width: 100%;

        overflow: hidden;

        text-overflow: ellipsis;

        white-space: nowrap;

        color: #ffffff;

        font-size: 10.5px;

        font-weight: 900;
      }

      .payment-option-text span {
        display: block;

        max-width: 100%;

        margin-top: 2px;

        overflow: hidden;

        text-overflow: ellipsis;

        white-space: nowrap;

        color: #8FA1B2;

        font-size: 8.5px;
      }

      .payment-arrow {
        flex-shrink: 0;

        color: #C0E040;

        font-size: 16px;

        font-weight: 950;
      }


      /* =====================================================
         PAYMENT INFO
      ===================================================== */

      .argo-payment-note {
        display: flex;

        align-items:
          flex-start;

        gap: 8px;

        width: 100%;

        box-sizing: border-box;

        margin-top: 12px;

        padding: 10px;

        border-radius: 9px;

        background:
          rgba(255,255,255,.035);

        color: #8FA1B2;

        font-size: 9px;

        line-height: 1.5;
      }

      .payment-info-icon {
        display: flex;

        align-items: center;

        justify-content: center;

        width: 16px;
        height: 16px;

        flex-shrink: 0;

        border-radius: 50%;

        background:
          rgba(192,224,64,.13);

        color: #C0E040;

        font-size: 9px;

        font-weight: 950;
      }


      /* =====================================================
         INSTRUCTION
      ===================================================== */

      .instruction {
        margin-top: 30px;

        padding: 22px;

        border:
          1px solid
          rgba(16,42,67,.10);

        border-radius: 18px;

        background: #ffffff;

        box-shadow:
          0 10px 30px
          rgba(16,42,67,.06);
      }

      .instruction-header {
        display: flex;

        align-items: center;

        gap: 12px;
      }

      .instruction-icon {
        display: flex;

        align-items: center;

        justify-content: center;

        width: 38px;
        height: 38px;

        flex-shrink: 0;

        border-radius: 11px;

        background: #102A43;

        color: #C0E040;

        font-size: 18px;

        font-weight: 950;
      }

      .instruction-header h3 {
        margin: 0;

        color: #102A43;

        font-size: 15px;

        font-weight: 950;
      }

      .instruction-header p {
        margin:
          3px 0 0;

        color: #829AB1;

        font-size: 10px;
      }

      .instruction-steps {
        display: flex;

        flex-direction: column;

        margin-top: 22px;
      }

      .instruction-step {
        display: flex;

        align-items:
          flex-start;

        gap: 13px;
      }

      .step-number {
        display: flex;

        align-items: center;

        justify-content: center;

        width: 34px;
        height: 34px;

        flex-shrink: 0;

        border:
          1px solid
          rgba(16,42,67,.12);

        border-radius: 9px;

        background:
          rgba(16,42,67,.045);

        color: #102A43;

        font-size: 10px;

        font-weight: 950;
      }

      .instruction-step strong {
        display: block;

        color: #102A43;

        font-size: 12px;

        font-weight: 950;
      }

      .instruction-step span {
        display: block;

        margin-top: 4px;

        color: #627D98;

        font-size: 10.5px;

        line-height: 1.5;
      }

      .instruction-line {
        width: 1px;
        height: 18px;

        margin:
          5px 0
          5px 16px;

        background:
          rgba(16,42,67,.12);
      }


      /* =====================================================
         FOOTER
      ===================================================== */

      .subscription-footer {
        margin-top: 22px;

        color: #829AB1;

        text-align: center;

        font-size: 9.5px;

        font-weight: 700;
      }


      /* =====================================================
         TABLET
      ===================================================== */

      @media (max-width: 820px) {

        .subscription-page {
          padding-left: 16px;
          padding-right: 16px;
        }

        .argo-plans {
          gap: 12px;
        }

        .argo-plan-card {
          padding: 17px;
        }

        .argo-plan-title {
          font-size: 17px;
        }

        .argo-new-price {
          font-size: 27px;
        }

        .argo-feature {
          font-size: 11px;
        }
      }


      /* =====================================================
         MOBILE
      ===================================================== */

      @media (max-width: 680px) {

        .subscription-page {
          padding:
            18px
            12px
            32px;
        }

        .subscription-header {
          margin-bottom: 23px;
        }

        .subscription-header h1 {
          font-size: 35px;
        }

        .subscription-header p {
          font-size: 13px;
        }


        /* ACTIVE SUMMARY */

        .active-summary {
          align-items:
            flex-start;

          flex-wrap: wrap;

          padding: 14px;
        }

        .active-summary-status {
          margin-left: 51px;
        }


        /* HEADER */

        .plans-header h2 {
          font-size: 19px;
        }

        .plans-header span {
          font-size: 10px;
        }


        /* PLANS */

        .argo-plans {
          display: flex;

          flex-direction: column;

          gap: 14px;
        }

        .argo-plan-card {
          width: 100%;

          box-sizing:
            border-box;

          padding: 19px;

          border-radius: 18px;
        }

        .argo-plan-card.base {
          order: 1;
        }

        .argo-plan-card:not(.base):not(.popular) {
          order: 2;
        }

        .argo-plan-card.popular {
          order: 3;
        }


        /* DISCOUNT */

        .argo-discount {
          padding:
            7px 10px;

          font-size: 10px;
        }


        /* TEXT */

        .argo-plan-title {
          font-size: 19px;
        }

        .argo-plan-description {
          font-size: 11px;
        }

        .argo-new-price {
          font-size: 30px;
        }

        .argo-feature {
          font-size: 12px;
        }


        /* BUTTON */

        .argo-plan-button {
          min-height: 48px;
        }


        /* COUNTDOWN */

        .countdown-box {
          min-width: 42px;
        }

        .countdown-box strong {
          font-size: 17px;
        }


        /* INSTRUCTION */

        .instruction {
          padding: 18px;

          margin-top: 25px;
        }
      }


      /* =====================================================
         SMALL MOBILE
      ===================================================== */

      @media (max-width: 420px) {

        .subscription-page {
          padding:
            16px
            10px
            28px;
        }

        .subscription-header h1 {
          font-size: 32px;
        }

        .plans-header h2 {
          font-size: 18px;
        }

        .argo-plan-card {
          padding: 17px;
        }

        .argo-plan-top {
          gap: 8px;
        }

        .argo-plan-title {
          font-size: 18px;
        }

        .argo-new-price {
          font-size: 28px;
        }

        .argo-feature {
          font-size: 11.5px;
        }

        .argo-payment-panel {
          padding: 12px;
        }

        .argo-payment-option {
          min-height: 52px;

          padding: 8px;
        }

        .payment-logo {
          width: 32px;
          height: 32px;
        }

        .payment-option-text strong {
          font-size: 10px;
        }

        .payment-option-text span {
          font-size: 8px;
        }

        .instruction-step span {
          font-size: 10px;
        }

        .active-plan-badge {
          font-size: 8px;

          padding:
            6px 9px;
        }
      }

    `}</style>
  );
}