import {
  createFileRoute,
  Navigate,
  useNavigate,
} from "@tanstack/react-router";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import {
  createOrder,
  countTodayOrders,
  listOrders,
} from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "ARGO — Қазақстандағы жүк тасымалдау сервисі",
      },
      {
        name: "description",
        content:
          "ARGO — жүк иелері мен жүргізушілерді байланыстыратын заманауи логистика сервисі. 30 күн тегін.",
      },
    ],
  }),
  component: Home,
});

const todayISO = () =>
  new Date().toISOString().slice(0, 10);

/* =========================================================
   HOME
========================================================= */

function Home() {
  const { user } = useAuth();

  if (user?.role === "driver") {
    return <Navigate to="/orders" replace />;
  }

  if (user?.role === "cargo_owner") {
    return <CargoOwnerHome />;
  }

  return <GuestHome />;
}

/* =========================================================
   GUEST HOME
========================================================= */

function GuestHome() {
  const navigate = useNavigate();
  const [popularOrders, setPopularOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const orders = await listOrders();

        const sorted = [...orders]
          .sort(
            (a, b) =>
              Number(b.views ?? 0) -
              Number(a.views ?? 0),
          )
          .slice(0, 6);

        setPopularOrders(sorted);
      } catch {
        // Қонақ бетінде қате көрсету міндетті емес
      }
    };

    load();
  }, []);

  return (
    <AppShell>
      <div className="argo-home">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="argo-hero">

          <div className="argo-hero-content">

            <div className="argo-sale-badge">
              <span className="argo-sale-dot" />
              ЖАҢА ҚОЛДАНУШЫЛАРҒА 30 КҮН ТЕГІН
            </div>

            <h1 className="argo-hero-title">
              Жүгіңізге
              <br />
              <span>дұрыс көлікті</span>
              табыңыз.
            </h1>

            <p className="argo-hero-text">
              ARGO — Қазақстан бойынша жүк иелері
              мен тасымалдаушыларды бір жерге
              біріктіретін заманауи логистика сервисі.
            </p>

            <div className="argo-hero-actions">

              <button
                className="argo-primary-btn"
                onClick={() =>
                  navigate({
                    to: "/auth",
                    search: {
                      redirect: "/",
                    },
                  })
                }
              >
                Жүк жариялау
                <span>→</span>
              </button>

              <button
                className="argo-secondary-btn"
                onClick={() =>
                  navigate({
                    to: "/orders",
                  })
                }
              >
                Жүктерді қарау
              </button>

            </div>

            <div className="argo-hero-note">
              <span>✓</span>
              Жүк жариялау тегін
            </div>

          </div>

          {/* =================================================
              HERO VISUAL
          ================================================= */}

          <div className="argo-hero-visual">

            <div className="argo-map">

              <div className="argo-map-grid" />

              <div className="argo-map-label argo-map-kz">
                KAZAKHSTAN
              </div>

              {/* Route */}

              <div className="argo-route route-1" />
              <div className="argo-route route-2" />
              <div className="argo-route route-3" />

              <div className="argo-city city-almaty">
                <i />
                Алматы
              </div>

              <div className="argo-city city-astana">
                <i />
                Астана
              </div>

              <div className="argo-city city-shymkent">
                <i />
                Шымкент
              </div>

              <div className="argo-city city-karaganda">
                <i />
                Қарағанды
              </div>

              {/* Trucks */}

              <div className="argo-truck truck-1">
                🚛
              </div>

              <div className="argo-truck truck-2">
                🚚
              </div>

              <div className="argo-truck truck-3">
                🚛
              </div>

              <div className="argo-map-card">
                <div className="argo-map-card-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Қазақстан бойынша
                  </strong>

                  <span>
                    бағыттар
                  </span>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            PROMO STRIP
        ===================================================== */}

        <section className="argo-promo">

          <div className="argo-promo-icon">
            %
          </div>

          <div className="argo-promo-main">
            <strong>
              30 КҮН — 0 ₸
            </strong>

            <span>
              Жаңа қолданушылар үшін алғашқы 30 күн
              толық тегін.
            </span>
          </div>

          <div className="argo-promo-divider" />

          <div className="argo-promo-item">
            <strong>
              100%
            </strong>
            <span>
              Жүк жариялау тегін
            </span>
          </div>

          <div className="argo-promo-item">
            <strong>
              ҚР
            </strong>
            <span>
              Қазақстан бойынша
            </span>
          </div>

          <button
            onClick={() =>
              navigate({
                to: "/auth",
                search: {
                  redirect: "/",
                },
              })
            }
            className="argo-promo-btn"
          >
            Қосылу →
          </button>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="argo-stats">

          <div>
            <strong>1000+</strong>
            <span>жүк</span>
          </div>

          <div>
            <strong>500+</strong>
            <span>тасымалдаушы</span>
          </div>

          <div>
            <strong>17</strong>
            <span>облыс</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>жүк іздеу</span>
          </div>

        </section>

        {/* =====================================================
            POPULAR ORDERS
        ===================================================== */}

        <section className="argo-section">

          <div className="argo-section-heading">

            <div>
              <div className="argo-eyebrow">
                КӨП ҚАРАЛҒАН
              </div>

              <h2>
                Қазір сұраныстағы
                <br />
                жүктер
              </h2>
            </div>

            <button
              className="argo-link-btn"
              onClick={() =>
                navigate({
                  to: "/orders",
                })
              }
            >
              Барлық жүктер →
            </button>

          </div>

          {popularOrders.length > 0 ? (
            <div className="argo-orders-grid">

              {popularOrders.map((order) => (
                <button
                  key={order.id}
                  className="argo-order-card"
                  onClick={() =>
                    navigate({
                      to: "/orders/$id",
                      params: {
                        id: order.id,
                      },
                    })
                  }
                >

                  <div className="argo-order-top">

                    <span className="argo-order-type">
                      {order.vehicle_type}
                    </span>

                    <span className="argo-order-views">
                      👁 {order.views ?? 0}
                    </span>

                  </div>

                  <div className="argo-order-route">

                    <div className="argo-order-point">
                      <i />
                      <strong>
                        {order.from_city}
                      </strong>
                    </div>

                    <div className="argo-order-line" />

                    <div className="argo-order-point">
                      <i />
                      <strong>
                        {order.to_city}
                      </strong>
                    </div>

                  </div>

                  <div className="argo-order-bottom">

                    <div>
                      <span>Жүк</span>
                      <strong>
                        {order.cargo_name}
                      </strong>
                    </div>

                    <div className="argo-order-price">
                      {order.negotiable
                        ? "Келісімді"
                        : `${Number(
                            order.price ?? 0,
                          ).toLocaleString(
                            "kk-KZ",
                          )} ₸`}
                    </div>

                  </div>

                </button>
              ))}

            </div>
          ) : (
            <div className="argo-empty-orders">
              <div>🚛</div>
              <strong>
                Жүктер жақында осында шығады
              </strong>
              <span>
                Бірінші болып жүк жариялап көріңіз.
              </span>
            </div>
          )}

        </section>

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="argo-how">

          <div className="argo-section-heading centered">

            <div>
              <div className="argo-eyebrow">
                ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ?
              </div>

              <h2>
                Жүк тасымалдау
                <br />
                енді оңай.
              </h2>
            </div>

          </div>

          <div className="argo-steps">

            <div className="argo-step">

              <div className="argo-step-number">
                01
              </div>

              <div className="argo-step-icon">
                📦
              </div>

              <h3>
                Жүкті жариялаңыз
              </h3>

              <p>
                Қайдан және қайда жеткізу керегін
                бірнеше минутта көрсетіңіз.
              </p>

            </div>

            <div className="argo-step">

              <div className="argo-step-number">
                02
              </div>

              <div className="argo-step-icon">
                🚛
              </div>

              <h3>
                Тасымалдаушыны табыңыз
              </h3>

              <p>
                Қазақстан бойынша бос көліктерді
                қарап, өзіңізге керегін таңдаңыз.
              </p>

            </div>

            <div className="argo-step">

              <div className="argo-step-number">
                03
              </div>

              <div className="argo-step-icon">
                🤝
              </div>

              <h3>
                Келісіңіз
              </h3>

              <p>
                Жүргізушімен байланысып,
                тасымалдау шарттарын келісіңіз.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            BIG CTA
        ===================================================== */}

        <section className="argo-final-cta">

          <div className="argo-final-glow" />

          <div className="argo-final-content">

            <div className="argo-sale-badge dark">
              <span className="argo-sale-dot" />
              АРНАЙЫ ҰСЫНЫС
            </div>

            <h2>
              Алғашқы 30 күн
              <br />
              <span>тегін.</span>
            </h2>

            <p>
              ARGO-ға қазір қосылыңыз.
              Жүк жариялау үшін төлем қажет емес.
            </p>

            <button
              className="argo-primary-btn"
              onClick={() =>
                navigate({
                  to: "/auth",
                  search: {
                    redirect: "/",
                  },
                })
              }
            >
              Тегін бастау
              <span>→</span>
            </button>

          </div>

          <div className="argo-final-truck">
            🚛
          </div>

        </section>

      </div>

      <HomeStyles />
    </AppShell>
  );
}

/* =========================================================
   CARGO OWNER HOME
========================================================= */

function CargoOwnerHome() {
  return (
    <AppShell width="narrow">

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <h1 className="page-title">
          Жүк жариялау
        </h1>

        <p className="page-sub">
          Жүргізушілер сіздің жүгіңізді көріп,
          тасымалдауға өтініш бере алады.
        </p>
      </div>

      <CargoPublishForm />

    </AppShell>
  );
}

/* =========================================================
   CARGO FORM
========================================================= */

function CargoPublishForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] =
    useState(false);

  const [form, setForm] =
    useState({
      cargo_name: "",
      vehicle_type:
        VEHICLE_TYPES[0],
      weight:
        "" as number | "",
      volume:
        "" as number | "",
      from_city:
        CITIES[0],
      from_address: "",
      to_city:
        CITIES[1],
      to_address: "",
      loading_date:
        todayISO(),
      price:
        "" as number | "",
      negotiable: false,
      contact_phone:
        user?.phone || "",
      comment: "",
    });

  const set = (
    p: Partial<typeof form>,
  ) => {
    setForm((f) => ({
      ...f,
      ...p,
    }));
  };

  const submit = async () => {

    if (!user) {
      toast.error(
        "Жүк жариялау үшін алдымен кіріңіз",
      );

      navigate({
        to: "/auth",
        search: {
          redirect: "/",
        },
      });

      return;
    }

    if (user.role !== "cargo_owner") {
      toast.error(
        "Жүк жариялау тек жүк салушыларға арналған",
      );
      return;
    }

    if (!form.cargo_name.trim()) {
      toast.error(
        "Жүк атауын енгізіңіз",
      );
      return;
    }

    if (!form.vehicle_type) {
      toast.error(
        "Көлік түрін таңдаңыз",
      );
      return;
    }

    if (
      form.weight === "" ||
      Number(form.weight) <= 0
    ) {
      toast.error(
        "Салмақты дұрыс енгізіңіз",
      );
      return;
    }

    if (
      form.volume === "" ||
      Number(form.volume) <= 0
    ) {
      toast.error(
        "Көлемді дұрыс енгізіңіз",
      );
      return;
    }

    if (!form.from_city) {
      toast.error(
        "Тиеу қаласын таңдаңыз",
      );
      return;
    }

    if (!form.to_city) {
      toast.error(
        "Түсіру қаласын таңдаңыз",
      );
      return;
    }

    if (!form.loading_date) {
      toast.error(
        "Тиеу күнін таңдаңыз",
      );
      return;
    }

    if (
      !form.negotiable &&
      (
        form.price === "" ||
        Number(form.price) <= 0
      )
    ) {
      toast.error(
        "Бағаны енгізіңіз немесе келісімді деп белгілеңіз",
      );
      return;
    }

    setBusy(true);

    try {

      const count =
        await countTodayOrders(
          user.id,
        );

      if (count >= 10) {
        toast.error(
          t("order.limitReached"),
        );
        return;
      }

      const order =
        await createOrder(
          {
            cargo_name:
              form.cargo_name.trim(),

            vehicle_type:
              form.vehicle_type,

            weight:
              Number(form.weight),

            volume:
              Number(form.volume),

            from_city:
              form.from_city,

            from_address:
              form.from_address.trim() ||
              undefined,

            to_city:
              form.to_city,

            to_address:
              form.to_address.trim() ||
              undefined,

            loading_date:
              form.loading_date,

            price:
              form.negotiable
                ? undefined
                : Number(form.price),

            negotiable:
              form.negotiable,

            contact_phone:
              form.contact_phone.trim() ||
              user.phone,

            comment:
              form.comment.trim() ||
              undefined,
          },
          user.id,
        );

      toast.success(
        t("order.publishSuccess"),
      );

      navigate({
        to: "/orders/$id",
        params: {
          id: order.id,
        },
      });

    } catch (e: any) {

      toast.error(
        e?.message ||
          "Жүк жариялау кезінде қате шықты",
      );

    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >

      <L label="Жүк атауы">
        <input
          className="input"
          value={form.cargo_name}
          onChange={(e) =>
            set({
              cargo_name:
                e.target.value,
            })
          }
          placeholder="Мысалы: құрылыс материалы, жиһаз, техника"
        />
      </L>

      <L label="Көлік түрі">
        <select
          className="input"
          value={form.vehicle_type}
          onChange={(e) =>
            set({
              vehicle_type:
                e.target.value,
            })
          }
        >
          {VEHICLE_TYPES.map((v) => (
            <option key={v}>
              {v}
            </option>
          ))}
        </select>
      </L>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: 12,
        }}
      >
        <L label="Салмақ, т">
          <input
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={form.weight}
            onChange={(e) => {
              const value =
                e.target.value;

              set({
                weight:
                  value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number(value),
                      ),
              });
            }}
            placeholder="20"
          />
        </L>

        <L label="Көлем, м³">
          <input
            className="input"
            type="number"
            min={0}
            step={0.1}
            value={form.volume}
            onChange={(e) => {
              const value =
                e.target.value;

              set({
                volume:
                  value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number(value),
                      ),
              });
            }}
            placeholder="86"
          />
        </L>
      </div>

      <L label="Тиеу қаласы">
        <select
          className="input"
          value={form.from_city}
          onChange={(e) =>
            set({
              from_city:
                e.target.value,
            })
          }
        >
          {CITIES.map((c) => (
            <option key={c}>
              {c}
            </option>
          ))}
        </select>
      </L>

      <L label="Тиеу мекенжайы">
        <input
          className="input"
          value={form.from_address}
          onChange={(e) =>
            set({
              from_address:
                e.target.value,
            })
          }
          placeholder="Аудан, көше, үй нөмірі"
        />
      </L>

      <L label="Түсіру қаласы">
        <select
          className="input"
          value={form.to_city}
          onChange={(e) =>
            set({
              to_city:
                e.target.value,
            })
          }
        >
          {CITIES.map((c) => (
            <option key={c}>
              {c}
            </option>
          ))}
        </select>
      </L>

      <L label="Түсіру мекенжайы">
        <input
          className="input"
          value={form.to_address}
          onChange={(e) =>
            set({
              to_address:
                e.target.value,
            })
          }
          placeholder="Аудан, көше, үй нөмірі"
        />
      </L>

      <L label="Тиеу күні">
        <input
          className="input"
          type="date"
          value={form.loading_date}
          onChange={(e) =>
            set({
              loading_date:
                e.target.value,
            })
          }
        />
      </L>

      <label
        className="chip"
        style={{
          cursor: "pointer",
          gap: 6,
          alignSelf:
            "flex-start",
        }}
      >
        <input
          type="checkbox"
          checked={
            form.negotiable
          }
          onChange={(e) =>
            set({
              negotiable:
                e.target.checked,
            })
          }
        />

        Баға келісімді
      </label>

      {!form.negotiable && (
        <L label="Баға, ₸">
          <input
            className="input"
            type="number"
            min={0}
            step={1000}
            value={form.price}
            onChange={(e) => {
              const value =
                e.target.value;

              set({
                price:
                  value === ""
                    ? ""
                    : Math.max(
                        0,
                        Number(value),
                      ),
              });
            }}
            placeholder="250000"
          />
        </L>
      )}

      <L label="Байланыс нөмірі">
        <input
          className="input"
          value={form.contact_phone}
          onChange={(e) =>
            set({
              contact_phone:
                e.target.value,
            })
          }
        />
      </L>

      <L label="Қосымша ақпарат">
        <textarea
          className="input"
          style={{
            minHeight: 100,
            resize: "vertical",
          }}
          value={form.comment}
          onChange={(e) =>
            set({
              comment:
                e.target.value,
            })
          }
          placeholder="Қосымша ақпарат..."
        />
      </L>

      <button
        className="btn accent"
        disabled={busy}
        onClick={submit}
        style={{
          marginTop: 4,
          minHeight: 44,
        }}
      >
        {busy
          ? t("common.loading")
          : t("common.publish")}
      </button>

    </div>
  );
}

/* =========================================================
   LABEL
========================================================= */

function L({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="step-label active"
        style={{
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   HOME CSS
========================================================= */

function HomeStyles() {
  return (
    <style>{`

      .argo-home {
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 10px 0 60px;
        color: #111;
      }

      /* ================================
         HERO
      ================================= */

      .argo-hero {
        min-height: 610px;
        border-radius: 32px;
        background:
          radial-gradient(
            circle at 80% 30%,
            rgba(42, 209, 119, .13),
            transparent 30%
          ),
          #f5f6f4;
        display: grid;
        grid-template-columns: 1fr 1fr;
        overflow: hidden;
        position: relative;
      }

      .argo-hero-content {
        padding: 78px 45px 70px 70px;
        position: relative;
        z-index: 2;
      }

      .argo-sale-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #e7f7ed;
        color: #158447;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .06em;
      }

      .argo-sale-badge.dark {
        background: rgba(255,255,255,.1);
        color: #fff;
      }

      .argo-sale-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #20a65a;
      }

      .argo-hero-title {
        margin: 22px 0 20px;
        font-size: clamp(48px, 5vw, 76px);
        line-height: .96;
        letter-spacing: -.055em;
        font-weight: 950;
      }

      .argo-hero-title span {
        color: #20a65a;
      }

      .argo-hero-text {
        max-width: 560px;
        margin: 0;
        font-size: 17px;
        line-height: 1.65;
        color: #68706b;
      }

      .argo-hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 32px;
      }

      .argo-primary-btn,
      .argo-secondary-btn {
        border: 0;
        min-height: 50px;
        padding: 0 21px;
        border-radius: 12px;
        font-weight: 850;
        cursor: pointer;
        transition: .2s ease;
      }

      .argo-primary-btn {
        background: #20a65a;
        color: #fff;
        box-shadow: 0 12px 30px rgba(32,166,90,.22);
      }

      .argo-primary-btn span {
        margin-left: 18px;
        font-size: 18px;
      }

      .argo-primary-btn:hover {
        transform: translateY(-2px);
        background: #178a49;
      }

      .argo-secondary-btn {
        background: #fff;
        color: #171a18;
        border: 1px solid #e2e5e1;
      }

      .argo-secondary-btn:hover {
        border-color: #20a65a;
      }

      .argo-hero-note {
        margin-top: 17px;
        color: #68706b;
        font-size: 12px;
        font-weight: 700;
      }

      .argo-hero-note span {
        color: #20a65a;
        margin-right: 6px;
      }

      /* ================================
         MAP
      ================================= */

      .argo-hero-visual {
        position: relative;
        min-height: 610px;
        overflow: hidden;
      }

      .argo-map {
        position: absolute;
        inset: 30px;
        border-radius: 28px;
        overflow: hidden;
        background:
          radial-gradient(
            circle at 48% 42%,
            rgba(32,166,90,.13),
            transparent 28%
          ),
          #e9eee9;
        border: 1px solid rgba(0,0,0,.05);
      }

      .argo-map-grid {
        position: absolute;
        inset: 0;
        opacity: .4;
        background-image:
          linear-gradient(
            rgba(20,30,25,.045) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(20,30,25,.045) 1px,
            transparent 1px
          );
        background-size: 42px 42px;
      }

      .argo-map-label {
        position: absolute;
        font-size: 60px;
        font-weight: 950;
        letter-spacing: .08em;
        color: rgba(30,60,45,.055);
        transform: rotate(-15deg);
        left: 13%;
        top: 40%;
      }

      .argo-route {
        position: absolute;
        height: 2px;
        background: #20a65a;
        transform-origin: left center;
        opacity: .7;
      }

      .route-1 {
        width: 280px;
        left: 25%;
        top: 52%;
        transform: rotate(-17deg);
      }

      .route-2 {
        width: 220px;
        left: 43%;
        top: 42%;
        transform: rotate(28deg);
      }

      .route-3 {
        width: 190px;
        left: 29%;
        top: 54%;
        transform: rotate(22deg);
      }

      .argo-city {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 800;
      }

      .argo-city i {
        width: 9px;
        height: 9px;
        background: #20a65a;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(32,166,90,.12);
      }

      .city-almaty {
        left: 22%;
        top: 65%;
      }

      .city-astana {
        left: 55%;
        top: 25%;
      }

      .city-shymkent {
        left: 12%;
        top: 78%;
      }

      .city-karaganda {
        left: 46%;
        top: 50%;
      }

      .argo-truck {
        position: absolute;
        width: 48px;
        height: 48px;
        border-radius: 15px;
        background: #fff;
        display: grid;
        place-items: center;
        font-size: 26px;
        box-shadow: 0 15px 30px rgba(0,0,0,.12);
        animation: argoFloat 4s ease-in-out infinite;
      }

      .truck-1 {
        left: 42%;
        top: 60%;
      }

      .truck-2 {
        left: 68%;
        top: 35%;
        animation-delay: -1s;
      }

      .truck-3 {
        left: 20%;
        top: 43%;
        animation-delay: -2s;
      }

      @keyframes argoFloat {
        0%,100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-7px);
        }
      }

      .argo-map-card {
        position: absolute;
        right: 22px;
        bottom: 22px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 15px;
        background: rgba(255,255,255,.94);
        border-radius: 14px;
        box-shadow: 0 12px 35px rgba(0,0,0,.12);
      }

      .argo-map-card-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        background: #e7f7ed;
        color: #20a65a;
        border-radius: 10px;
        font-weight: 900;
      }

      .argo-map-card strong,
      .argo-map-card span {
        display: block;
      }

      .argo-map-card strong {
        font-size: 12px;
      }

      .argo-map-card span {
        margin-top: 2px;
        color: #777;
        font-size: 11px;
      }

      /* ================================
         PROMO
      ================================= */

      .argo-promo {
        margin-top: 14px;
        min-height: 90px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 18px;
        border-radius: 18px;
        background: #121614;
        color: #fff;
      }

      .argo-promo-icon {
        width: 54px;
        height: 54px;
        flex: 0 0 54px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: #20a65a;
        font-size: 22px;
        font-weight: 950;
      }

      .argo-promo-main {
        flex: 1;
      }

      .argo-promo-main strong {
        display: block;
        font-size: 17px;
      }

      .argo-promo-main span {
        display: block;
        margin-top: 3px;
        color: #9ca49f;
        font-size: 12px;
      }

      .argo-promo-divider {
        width: 1px;
        height: 42px;
        background: #343936;
      }

      .argo-promo-item strong,
      .argo-promo-item span {
        display: block;
      }

      .argo-promo-item strong {
        font-size: 16px;
      }

      .argo-promo-item span {
        margin-top: 2px;
        color: #9ca49f;
        font-size: 11px;
      }

      .argo-promo-btn {
        border: 1px solid #3b4540;
        background: transparent;
        color: #fff;
        border-radius: 10px;
        padding: 11px 16px;
        cursor: pointer;
        font-weight: 800;
      }

      .argo-promo-btn:hover {
        border-color: #20a65a;
      }

      /* ================================
         STATS
      ================================= */

      .argo-stats {
        display: grid;
        grid-template-columns:
          repeat(4, 1fr);
        margin: 45px 0 75px;
        border-top: 1px solid #e6e9e6;
        border-bottom: 1px solid #e6e9e6;
      }

      .argo-stats > div {
        padding: 25px;
        text-align: center;
        border-right: 1px solid #e6e9e6;
      }

      .argo-stats > div:last-child {
        border-right: 0;
      }

      .argo-stats strong,
      .argo-stats span {
        display: block;
      }

      .argo-stats strong {
        font-size: 30px;
        letter-spacing: -.04em;
      }

      .argo-stats span {
        margin-top: 5px;
        color: #7b827e;
        font-size: 12px;
      }

      /* ================================
         SECTION
      ================================= */

      .argo-section {
        margin-bottom: 90px;
      }

      .argo-section-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 28px;
      }

      .argo-section-heading.centered {
        justify-content: center;
        text-align: center;
      }

      .argo-eyebrow {
        color: #20a65a;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .14em;
      }

      .argo-section-heading h2 {
        margin: 8px 0 0;
        font-size: 42px;
        line-height: 1;
        letter-spacing: -.05em;
      }

      .argo-link-btn {
        border: 0;
        background: transparent;
        color: #20a65a;
        font-weight: 850;
        cursor: pointer;
      }

      /* ================================
         ORDERS
      ================================= */

      .argo-orders-grid {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap: 14px;
      }

      .argo-order-card {
        border: 1px solid #e3e7e4;
        background: #fff;
        border-radius: 18px;
        padding: 18px;
        text-align: left;
        cursor: pointer;
        transition: .2s ease;
      }

      .argo-order-card:hover {
        transform: translateY(-4px);
        border-color: #20a65a;
        box-shadow:
          0 16px 40px rgba(20,40,30,.08);
      }

      .argo-order-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .argo-order-type {
        padding: 6px 9px;
        border-radius: 8px;
        background: #f1f3f1;
        font-size: 10px;
        font-weight: 800;
      }

      .argo-order-views {
        color: #8a918d;
        font-size: 11px;
      }

      .argo-order-route {
        margin: 22px 0;
      }

      .argo-order-point {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .argo-order-point i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #20a65a;
      }

      .argo-order-point strong {
        font-size: 14px;
      }

      .argo-order-line {
        width: 1px;
        height: 18px;
        margin: 3px 0 3px 4px;
        background: #dce1dd;
      }

      .argo-order-bottom {
        padding-top: 14px;
        border-top: 1px solid #edf0ed;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
      }

      .argo-order-bottom span,
      .argo-order-bottom strong {
        display: block;
      }

      .argo-order-bottom span {
        color: #8a918d;
        font-size: 10px;
      }

      .argo-order-bottom strong {
        margin-top: 4px;
        font-size: 12px;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .argo-order-price {
        color: #20a65a;
        font-size: 14px;
        font-weight: 950;
        white-space: nowrap;
      }

      .argo-empty-orders {
        padding: 70px 20px;
        border: 1px dashed #dce2dd;
        border-radius: 18px;
        text-align: center;
      }

      .argo-empty-orders div {
        font-size: 38px;
      }

      .argo-empty-orders strong {
        display: block;
        margin-top: 12px;
      }

      .argo-empty-orders span {
        display: block;
        margin-top: 5px;
        color: #858d88;
        font-size: 12px;
      }

      /* ================================
         HOW
      ================================= */

      .argo-how {
        margin-bottom: 80px;
      }

      .argo-steps {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap: 14px;
        margin-top: 35px;
      }

      .argo-step {
        position: relative;
        padding: 28px;
        min-height: 240px;
        background: #f5f6f4;
        border-radius: 20px;
      }

      .argo-step-number {
        position: absolute;
        top: 22px;
        right: 24px;
        color: #c7cdc8;
        font-size: 11px;
        font-weight: 900;
      }

      .argo-step-icon {
        font-size: 35px;
      }

      .argo-step h3 {
        margin: 22px 0 8px;
        font-size: 18px;
      }

      .argo-step p {
        margin: 0;
        max-width: 300px;
        color: #737b76;
        line-height: 1.55;
        font-size: 13px;
      }

      /* ================================
         FINAL CTA
      ================================= */

      .argo-final-cta {
        min-height: 350px;
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        background: #111513;
        color: #fff;
        display: flex;
        align-items: center;
      }

      .argo-final-glow {
        position: absolute;
        width: 500px;
        height: 500px;
        right: 5%;
        top: -170px;
        border-radius: 50%;
        background: rgba(32,166,90,.12);
        filter: blur(20px);
      }

      .argo-final-content {
        position: relative;
        z-index: 2;
        padding: 55px;
      }

      .argo-final-content h2 {
        margin: 20px 0 12px;
        font-size: 52px;
        line-height: .96;
        letter-spacing: -.055em;
      }

      .argo-final-content h2 span {
        color: #20a65a;
      }

      .argo-final-content p {
        margin: 0 0 24px;
        color: #9ba39e;
      }

      .argo-final-truck {
        position: absolute;
        right: 8%;
        bottom: -35px;
        font-size: 190px;
        filter: grayscale(1);
        opacity: .18;
      }

      /* ================================
         MOBILE
      ================================= */

      @media (max-width: 900px) {

        .argo-hero {
          grid-template-columns: 1fr;
          min-height: auto;
        }

        .argo-hero-content {
          padding: 48px 28px 35px;
        }

        .argo-hero-visual {
          min-height: 390px;
        }

        .argo-map {
          inset: 15px;
        }

        .argo-hero-title {
          font-size: 50px;
        }

        .argo-promo {
          flex-wrap: wrap;
          padding: 15px;
        }

        .argo-promo-divider {
          display: none;
        }

        .argo-promo-main {
          min-width: 200px;
        }

        .argo-promo-btn {
          width: 100%;
        }

        .argo-stats {
          grid-template-columns:
            repeat(2, 1fr);
        }

        .argo-stats > div:nth-child(2) {
          border-right: 0;
        }

        .argo-stats > div:nth-child(-n+2) {
          border-bottom: 1px solid #e6e9e6;
        }

        .argo-orders-grid {
          grid-template-columns: 1fr;
        }

        .argo-steps {
          grid-template-columns: 1fr;
        }

        .argo-section-heading {
          align-items: flex-start;
          flex-direction: column;
        }

        .argo-section-heading h2 {
          font-size: 35px;
        }

        .argo-final-content {
          padding: 40px 25px;
        }

        .argo-final-content h2 {
          font-size: 42px;
        }

        .argo-final-truck {
          font-size: 100px;
          right: -5px;
        }
      }

      @media (max-width: 520px) {

        .argo-home {
          padding-top: 0;
        }

        .argo-hero {
          border-radius: 20px;
        }

        .argo-hero-content {
          padding: 35px 20px 30px;
        }

        .argo-hero-title {
          font-size: 43px;
        }

        .argo-hero-text {
          font-size: 14px;
        }

        .argo-hero-actions {
          flex-direction: column;
        }

        .argo-primary-btn,
        .argo-secondary-btn {
          width: 100%;
        }

        .argo-hero-visual {
          min-height: 320px;
        }

        .argo-map-label {
          font-size: 36px;
        }

        .argo-promo-main {
          width: 100%;
        }

        .argo-promo-item {
          flex: 1;
        }

        .argo-stats {
          margin: 35px 0 55px;
        }

        .argo-stats strong {
          font-size: 24px;
        }

        .argo-section {
          margin-bottom: 60px;
        }

        .argo-final-cta {
          border-radius: 20px;
        }

      }

    `}</style>
  );
}