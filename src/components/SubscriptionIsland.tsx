import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/store";
import {
  getSubscription,
  subscriptionIsActive,
} from "@/lib/services";

type IslandMode = "trial" | "discount" | null;

/*
 * Соңғы көрсетілген уақыт.
 * 1 сағат өткеннен кейін қайта көрсетуге болады.
 */
const STORAGE_KEY = "argo_subscription_island_time";

const ONE_HOUR = 60 * 60 * 1000;

/* =========================================================
   СОҢҒЫ КӨРСЕТІЛГЕН УАҚЫТТЫ АЛУ
========================================================= */

function getLastShownTime(): number {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    if (!value) {
      return 0;
    }

    const time = Number(value);

    return Number.isFinite(time) ? time : 0;
  } catch {
    return 0;
  }
}

/* =========================================================
   1 САҒАТ ӨТТІ МЕ?
========================================================= */

function canShowNow(): boolean {
  const lastShown = getLastShownTime();

  if (!lastShown) {
    return true;
  }

  return Date.now() - lastShown >= ONE_HOUR;
}

/* =========================================================
   КӨРСЕТІЛГЕН УАҚЫТТЫ САҚТАУ
========================================================= */

function markShownNow() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      String(Date.now())
    );
  } catch {}
}

/* =========================================================
   COMPONENT
========================================================= */

export function SubscriptionIsland() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [visible, setVisible] =
    useState(false);

  const [mode, setMode] =
    useState<IslandMode>(null);

  /*
   * Supabase-ден жазылымды тексеру.
   */
  const {
    data: subscription,
    isLoading,
  } = useQuery({
    queryKey: [
      "subscription-island",
      user?.id,
    ],

    queryFn: () =>
      getSubscription(user!.id),

    enabled: !!user?.id,

    /*
     * Әр 1 минут сайын Supabase-ден
     * қайта тексеруге мүмкіндік береді.
     */
    staleTime: 60_000,

    refetchInterval: 60_000,
  });

  /* =======================================================
     ISLAND LOGIC
  ======================================================= */

  useEffect(() => {
    /*
     * Қолданушы кірмеген болса —
     * Island көрсетілмейді.
     */
    if (!user?.id) {
      setVisible(false);
      setMode(null);
      return;
    }

    /*
     * Supabase жауабын күтеміз.
     */
    if (isLoading) {
      return;
    }

    /*
     * БЕЛСЕНДІ ЖАЗЫЛЫМ БАР.
     *
     * Мұндай адамға Island мүлде шықпайды.
     */
    if (
      subscriptionIsActive(
        subscription ?? undefined
      )
    ) {
      setVisible(false);
      setMode(null);

      return;
    }

    /*
     * 1 сағат әлі өтпесе —
     * қайта көрсетпейміз.
     */
    if (!canShowNow()) {
      setVisible(false);
      return;
    }

    /*
     * =====================================================
     * ҚАЙ ТҮРДЕГІ ҰСЫНЫС КӨРСЕТІЛЕДІ?
     * =====================================================
     *
     * subscription жоқ:
     * → бірінші рет кірген адам
     * → 30 күн тегін
     *
     * subscription бар, бірақ active емес:
     * → бұрын жазылым болған
     * → 50% жеңілдік
     */

    if (!subscription) {
      setMode("trial");
    } else {
      setMode("discount");
    }

    /*
     * Осы сәтте көрсетілген уақытты сақтаймыз.
     *
     * Сондықтан Island жабылса да,
     * келесі 1 сағат ішінде қайта шықпайды.
     */
    markShownNow();

    setVisible(true);

  }, [
    user?.id,
    subscription,
    isLoading,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  if (
    !visible ||
    !user ||
    !mode
  ) {
    return null;
  }

  const isTrial =
    mode === "trial";

  return (
    <div className="subscription-island-wrap">

      <div className="subscription-island">

        {/* Glow animation */}
        <div className="subscription-island-glow" />

        <div className="subscription-island-content">

          {/* ICON */}
          <div className="subscription-island-icon">
            {isTrial ? "🎁" : "🔥"}
          </div>

          {/* TEXT */}
          <div className="subscription-island-text">

            {/* BADGE */}
            <div className="subscription-island-badge">

              {isTrial
                ? "ARGO START"
                : "АРНАЙЫ ҰСЫНЫС"}

            </div>

            {/* TITLE */}
            <div className="subscription-island-title">

              {isTrial
                ? "30 күнге тегін алыңыз"
                : "Жазылымға 50% жеңілдік"}

            </div>

            {/* SUBTITLE */}
            <div className="subscription-island-subtitle">

              {isTrial
                ? "Алғашқы ай — бізден 🎉"
                : "Жазылымыңыз аяқталды. Қайта қосылыңыз 🔥"}

            </div>

          </div>

          {/* BUTTON */}
          <button
            className="subscription-island-button"
            onClick={() =>
              navigate({
                to: "/subscription" as any,
              })
            }
          >

            {isTrial
              ? "Тегін алу"
              : "Жеңілдік алу"}

          </button>

        </div>

        {/* CLOSE / HIDE */}
        <button
          className="subscription-island-close"
          aria-label="Жабу"
          onClick={() => {
            setVisible(false);
          }}
        >
          ↑
        </button>

      </div>

    </div>
  );
}