import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { ComplaintModal } from "@/components/ComplaintModal";

import {
  kzt,
  maskPhones,
  shortDate,
} from "@/lib/format";

import { useI18n } from "@/lib/i18n";

import {
  getOrder,
  getUser,
  bumpPhoneView,
  bumpView,
  isSubscriptionActiveAsync,
} from "@/lib/services";

import { useAuth } from "@/lib/store";


export const Route = createFileRoute("/orders/$id")({
  component: OrderDetail,
});


function getInitials(name?: string) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


function OrderDetail() {
  const { id } = useParams({
    from: "/orders/$id",
  });

  const { t } = useI18n();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { user } = useAuth();


  const [revealed, setRevealed] =
    useState(false);

  const [complaintOpen, setComplaintOpen] =
    useState(false);


  /*
   * =========================================================
   * VIEW COUNT
   * =========================================================
   */

  const viewBumpedRef =
    useRef<string | null>(null);


  /*
   * =========================================================
   * ORDER
   * =========================================================
   */

  const {
    data: order,
    isLoading,
  } = useQuery({
    queryKey: ["order", id],

    queryFn: () => getOrder(id),
  });


  /*
   * =========================================================
   * OWNER
   * =========================================================
   */

  const {
    data: owner,
  } = useQuery({
    queryKey: ["user", order?.owner_id],

    queryFn: () =>
      getUser(order!.owner_id),

    enabled: !!order?.owner_id,
  });


  /*
   * =========================================================
   * SUBSCRIPTION
   * =========================================================
   */

  const {
    data: hasActiveSubscription,
  } = useQuery({
    queryKey: [
      "subscription-active",
      user?.id,
    ],

    queryFn: async () => {
      if (!user?.id) return false;

      return await isSubscriptionActiveAsync(
        user.id,
      );
    },

    enabled: !!user?.id,
  });


  /*
   * =========================================================
   * VIEW COUNT
   * =========================================================
   */

  useEffect(() => {
    if (!order) return;

    /*
     * Жүк иесі өзінің жүгін ашса,
     * қаралымға есептелмейді.
     */
    if (user?.id === order.owner_id) {
      return;
    }

    /*
     * Бір жүк үшін бір рет қана.
     */
    if (
      viewBumpedRef.current ===
      order.id
    ) {
      return;
    }

    viewBumpedRef.current =
      order.id;

    bumpView(order.id)
      .catch((error) => {
        console.error(
          "View count error:",
          error,
        );

        if (
          viewBumpedRef.current ===
          order.id
        ) {
          viewBumpedRef.current =
            null;
        }
      });
  }, [
    order?.id,
    order?.owner_id,
    user?.id,
  ]);


  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (isLoading) {
    return (
      <AppShell width="medium">

        <div
          className="text-muted"
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          {t("common.loading")}
        </div>

      </AppShell>
    );
  }


  /*
   * =========================================================
   * NOT FOUND
   * =========================================================
   */

  if (!order) {
    return (
      <AppShell width="medium">

        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          404
        </div>

      </AppShell>
    );
  }


  /*
   * =========================================================
   * PERMISSIONS
   * =========================================================
   */

  const isOwner =
    user?.id === order.owner_id;

  const isAdmin =
    user?.role === "admin";

  const canSeePhone =
    isOwner ||
    isAdmin ||
    hasActiveSubscription;


  /*
   * =========================================================
   * SHOW PHONE
   * =========================================================
   */

  const reveal = async () => {
    if (!user) {
      toast.error(
        "Номерді көру үшін алдымен кіріңіз",
      );

      navigate({
        to: "/auth",
        search: {
          redirect:
            `/orders/${order.id}`,
        },
      });

      return;
    }

    if (!canSeePhone) {
      toast.error(
        "Номерді көру үшін жазылым қажет",
      );

      navigate({
        to: "/pricing",
      });

      return;
    }

    try {
      await bumpPhoneView(
        order.id,
      );

      setRevealed(true);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Нөмірді ашу кезінде қате шықты",
      );
    }
  };


  /*
   * =========================================================
   * WHATSAPP
   * =========================================================
   */

  const openWhatsApp = () => {
    /*
     * Авторизация жоқ.
     */
    if (!user) {
      toast.error(
        "WhatsApp арқылы хабарласу үшін алдымен кіріңіз",
      );

      navigate({
        to: "/auth",
        search: {
          redirect:
            `/orders/${order.id}`,
        },
      });

      return;
    }


    /*
     * Жазылым жоқ.
     */
    if (!canSeePhone) {
      toast.error(
        "WhatsApp арқылы хабарласу үшін жазылым қажет",
      );

      navigate({
        to: "/pricing",
      });

      return;
    }


    /*
     * Нөмірді алдымен order-ден,
     * болмаса owner profile-ден аламыз.
     */
    const phone =
      order.contact_phone ||
      owner?.phone;


    /*
     * Нөмір мүлде жоқ.
     */
    if (!phone) {
      toast.error(
        "Бұл жүк иесінде WhatsApp нөмірі көрсетілмеген",
      );

      return;
    }


    /*
     * Барлық артық символдарды алып тастаймыз.
     *
     * +7 (777) 123-45-67
     * ↓
     * 77771234567
     */
    let whatsappPhone =
      phone.replace(/\D/g, "");


    /*
     * Қазақстанның 8-ден басталатын
     * нөмірін 7-ге ауыстырамыз.
     *
     * 8 777 123 45 67
     * ↓
     * 7 777 123 45 67
     */
    if (
      whatsappPhone.startsWith("8")
    ) {
      whatsappPhone =
        "7" +
        whatsappPhone.slice(1);
    }


    /*
     * Егер 10 цифр болса,
     * Қазақстан коды 7 қосылады.
     *
     * 7771234567
     * ↓
     * 77771234567
     */
    if (
      !whatsappPhone.startsWith("7") &&
      whatsappPhone.length === 10
    ) {
      whatsappPhone =
        "7" +
        whatsappPhone;
    }


    /*
     * Нөмір форматы тым қысқа болса.
     */
    if (
      whatsappPhone.length < 11
    ) {
      toast.error(
        "Жүк иесінің WhatsApp нөмірі дұрыс көрсетілмеген",
      );

      return;
    }


    /*
     * WhatsApp direct link.
     */
    const whatsappUrl =
      `https://wa.me/${whatsappPhone}`;


    /*
     * WhatsApp-ты жаңа вкладкада ашамыз.
     */
    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };


  /*
   * =========================================================
   * SUBSCRIBE
   * =========================================================
   */

  const goToSubscribe = () => {
    if (!user) {
      navigate({
        to: "/auth",
        search: {
          redirect:
            `/orders/${order.id}`,
        },
      });

      return;
    }

    navigate({
      to: "/pricing",
    });
  };


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <AppShell width="medium">


      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        className="back-btn"
        onClick={() =>
          navigate({
            to: "/orders",
          })
        }
      >
        ← {t("common.back")}
      </button>


      {/* =====================================================
          ORDER HERO
      ===================================================== */}

      <div className="order-hero">


        {/* ROUTE */}

        <div
          className="cargo-card-route"
          style={{
            fontSize: 22,
          }}
        >

          <span>
            {order.from_city}
          </span>

          <Icon.arrow
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
            }}
          />

          <span>
            {order.to_city}
          </span>

        </div>


        {/* CARGO NAME */}

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            marginTop: 6,
          }}
        >
          {order.cargo_name}
        </div>


        {/* CHIPS */}

        <div
          className="cargo-chips"
          style={{
            marginTop: 12,
          }}
        >

          <span className="chip accent">
            {order.vehicle_type}
          </span>


          <span className="chip">

            <Icon.calendar
              style={{
                width: 11,
                height: 11,
              }}
            />

            {shortDate(
              order.loading_date,
            )}

          </span>


          <span className="chip">

            <Icon.eye
              style={{
                width: 11,
                height: 11,
              }}
            />

            {order.views}{" "}

            {t("order.views")
              .toLowerCase()}

          </span>

        </div>


        {/* PRICE */}

        <div className="order-price-box">

          <label>
            {t("order.price")}
          </label>

          <div className="order-price-val">

            {order.negotiable
              ? t("order.negotiable")
              : kzt(order.price)}

          </div>

        </div>


        {/* INFO */}

        <div className="info-grid">


          {/* WEIGHT */}

          <div className="info-item">

            <div className="il">

              <Icon.bar
                style={{
                  width: 12,
                  height: 12,
                }}
              />

              {t("order.weight")}

            </div>

            <div className="iv">
              {order.weight} т
            </div>

          </div>


          {/* VOLUME */}

          <div className="info-item">

            <div className="il">

              <Icon.boxes
                style={{
                  width: 12,
                  height: 12,
                }}
              />

              {t("order.volume")}

            </div>

            <div className="iv">
              {order.volume} м³
            </div>

          </div>

        </div>


        {/* COMMENT */}

        {order.comment && (

          <div
            className="info-item"
            style={{
              marginTop: 10,
            }}
          >

            <div className="il">
              {t("order.comment")}
            </div>

            <div
              style={{
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {maskPhones(
                order.comment || "",
              )}
            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          ROUTE DETAILS
      ===================================================== */}

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >


        {/* FROM */}

        <div className="route-step">

          <div
            className="route-dot"
            style={{
              background:
                "var(--accent)",
              color:
                "var(--accent-fg)",
            }}
          >

            <Icon.mapPin
              style={{
                width: 14,
                height: 14,
              }}
            />

          </div>


          <div>

            <div
              style={{
                fontWeight: 800,
              }}
            >
              {order.from_city}
            </div>

            <div
              className="text-muted"
              style={{
                fontSize: 13,
              }}
            >

              {canSeePhone
                ? order.from_address ||
                  "—"
                : "•••••• (жазылым қажет)"}

            </div>

          </div>

        </div>


        {/* LINE */}

        <div
          style={{
            borderLeft:
              "2px dashed var(--border)",
            height: 24,
            marginLeft: 13,
          }}
        />


        {/* TO */}

        <div className="route-step">

          <div
            className="route-dot"
            style={{
              background:
                "var(--fg)",
              color:
                "var(--bg)",
            }}
          >

            <Icon.mapPin
              style={{
                width: 14,
                height: 14,
              }}
            />

          </div>


          <div>

            <div
              style={{
                fontWeight: 800,
              }}
            >
              {order.to_city}
            </div>

            <div
              className="text-muted"
              style={{
                fontSize: 13,
              }}
            >

              {canSeePhone
                ? order.to_address ||
                  "—"
                : "•••••• (жазылым қажет)"}

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          OWNER CARD
      ===================================================== */}

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >


        {/* OWNER INFORMATION */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
            minWidth: 0,
          }}
        >


          {/* AVATAR */}

          <div
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#1a1c28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 15,
              color: "#fff",
            }}
          >

            {owner?.avatar_url ? (

              <img
                src={owner.avatar_url}
                alt="Avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition:
                    "center center",
                  display: "block",
                }}
              />

            ) : (

              getInitials(
                owner?.full_name,
              )

            )}

          </div>


          {/* COMPANY + NAME */}

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >

            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >

              {owner?.company_name ||
                (owner?.full_name
                  ? `ИП ${owner.full_name}`
                  : "—")}

            </div>


            {owner?.company_name && (

              <div
                className="text-muted"
                style={{
                  fontSize: 12,
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {owner.full_name}
              </div>

            )}

          </div>

        </div>


        {/* =================================================
            CONTACT BUTTONS
        ================================================= */}

        {canSeePhone &&
        revealed ? (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 8,
              width: "100%",
            }}
          >


            {/* PHONE */}

            <a
              href={`tel:${
                order.contact_phone ||
                owner?.phone
              }`}
              className="btn accent"
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
              }}
            >

              <Icon.phone
                style={{
                  width: 16,
                  height: 16,
                }}
              />

              Қоңырау

            </a>


            {/* WHATSAPP */}

            <button
              type="button"
              className="btn primary"
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
              }}
              onClick={
                openWhatsApp
              }
            >

              <span
                style={{
                  fontSize: 16,
                  lineHeight: 1,
                  fontWeight: 900,
                }}
              >
                W
              </span>

              WhatsApp

            </button>

          </div>

        ) : canSeePhone ? (

          <button
            className="btn primary w-full"
            style={{
              width: "100%",
            }}
            onClick={reveal}
          >

            <Icon.phone
              style={{
                width: 16,
                height: 16,
              }}
            />

            {t("order.showPhone")}

          </button>

        ) : (

          <div className="locked-box">


            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >

              <Icon.lock
                style={{
                  width: 18,
                  height: 18,
                }}
              />


              <div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  Номерді көру үшін
                  жазылым қажет
                </div>


                <div
                  className="text-muted"
                  style={{
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Жазылым сатып алғаннан
                  кейін жүк иесінің
                  номері мен мекенжайы
                  ашылады.
                </div>

              </div>

            </div>


            <button
              className="btn primary w-full"
              style={{
                width: "100%",
                marginTop: 12,
              }}
              onClick={
                goToSubscribe
              }
            >

              {user
                ? "Жазылым алу"
                : t("common.login")}

            </button>

          </div>

        )}


        {/* =================================================
            COMPLAINT
        ================================================= */}

        {!isOwner && (

          <button
            className="back-btn"
            style={{
              marginTop: 14,
              marginBottom: 0,
            }}
            onClick={() =>
              user
                ? setComplaintOpen(
                    true,
                  )
                : navigate({
                    to: "/auth",
                  })
            }
          >

            <Icon.flag
              style={{
                width: 14,
                height: 14,
              }}
            />

            {t("complaint.title")}

          </button>

        )}

      </div>


      {/* =====================================================
          COMPLAINT MODAL
      ===================================================== */}

      {complaintOpen && (

        <ComplaintModal
          targetType="order"
          targetId={order.id}
          onClose={() =>
            setComplaintOpen(
              false,
            )
          }
        />

      )}

    </AppShell>
  );
}