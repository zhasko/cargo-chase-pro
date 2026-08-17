import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "./supabase";

import {
  isSubscriptionActiveAsync,
  startTrialSubscription,
} from "./services";

import type { Role, User } from "./types";

const SESSION_KEY = "argo_session_v1";
const LANG_KEY = "argo_lang";

type Lang = "kk" | "ru" | "en";

const translations = {
  kk: {
    blockedAccount: "Бұл аккаунт бұғатталған",
    sessionRefreshError: "Сессияны жаңарту қатесі",
    profileRefreshError: "Профильді жаңарту қатесі",
    findByPhoneError: "Телефон нөмірі бойынша іздеу қатесі",
    registerError: "Профильді тіркеу қатесі",
    trialError: "Сынақ жазылымын қосу қатесі",
    switchRoleError: "Рөлді ауыстыру қатесі",
    subscriptionError: "Жазылымды тексеру қатесі",
  },

  ru: {
    blockedAccount: "Этот аккаунт заблокирован",
    sessionRefreshError: "Ошибка обновления сессии",
    profileRefreshError: "Ошибка обновления профиля",
    findByPhoneError: "Ошибка поиска по номеру телефона",
    registerError: "Ошибка регистрации профиля",
    trialError: "Ошибка подключения пробной подписки",
    switchRoleError: "Ошибка смены роли",
    subscriptionError: "Ошибка проверки подписки",
  },

  en: {
    blockedAccount: "This account is blocked",
    sessionRefreshError: "Session refresh error",
    profileRefreshError: "Profile refresh error",
    findByPhoneError: "Phone number search error",
    registerError: "Profile registration error",
    trialError: "Trial subscription error",
    switchRoleError: "Role switch error",
    subscriptionError: "Subscription check error",
  },
};

type TranslationKey = keyof typeof translations.kk;

function getCurrentLang(): Lang {
  if (typeof localStorage === "undefined") {
    return "kk";
  }

  const saved = localStorage.getItem(LANG_KEY);

  if (
    saved === "kk" ||
    saved === "ru" ||
    saved === "en"
  ) {
    return saved;
  }

  return "kk";
}

function tr(key: TranslationKey): string {
  const lang = getCurrentLang();

  return translations[lang][key];
}

interface AuthCtx {
  user: User | null;
  ready: boolean;
  hasActiveSub: boolean;

  findByPhone: (
    phone: string
  ) => Promise<User | null>;

  loginExisting: (
    user: User
  ) => void;

  register: (data: {
    phone: string;
    full_name: string;
    role: Role;
    company_name?: string;
    vehicle_type?: string;
    load_capacity?: number;
    volume?: number;
    current_city?: string;
  }) => Promise<User>;

  logout: () => void;

  switchRole: (
    role: Role
  ) => Promise<void>;

  refresh: () => void;
}

const Ctx =
  createContext<AuthCtx | null>(null);

/* =====================================================
   PHONE
===================================================== */

function normalizePhone(
  phone: string
) {
  const digits =
    phone.replace(/\D/g, "");

  if (
    digits.startsWith("8") &&
    digits.length === 11
  ) {
    return (
      "+7" +
      digits.slice(1)
    );
  }

  if (
    digits.startsWith("7")
  ) {
    return "+" + digits;
  }

  return "+" + digits;
}

/* =====================================================
   PROFILE → USER
===================================================== */

function mapProfile(
  row: any
): User {
  return {
    id: row.id,

    public_id:
      row.public_id,

    phone:
      row.phone,

    full_name:
      row.full_name,

    company_name:
      row.company_name ??
      undefined,

    role:
      row.role,

    status:
      row.status ??
      "active",

    created_at:
      row.created_at,

    avatar_url:
      row.avatar_url ??
      undefined,
  };
}

/* =====================================================
   AUTH PROVIDER
===================================================== */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [ready, setReady] =
    useState(false);

  const [, setTick] =
    useState(0);

  const [
    hasActiveSub,
    setHasActiveSub,
  ] = useState(false);

  /* ===================================================
     PERSIST
  =================================================== */

  const persist = (
    u: User | null
  ) => {
    setUser(u);

    if (
      typeof localStorage !==
      "undefined"
    ) {
      if (u) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify(u)
        );
      } else {
        localStorage.removeItem(
          SESSION_KEY
        );
      }
    }
  };

  /* ===================================================
     LOAD SESSION
  =================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadSession =
      async () => {
        try {
          const saved =
            localStorage.getItem(
              SESSION_KEY
            );

          /*
           * Алдымен localStorage
           */
          if (saved) {
            try {
              const parsed =
                JSON.parse(saved);

              if (
                parsed &&
                parsed.id
              ) {
                if (
                  !cancelled
                ) {
                  setUser(
                    parsed
                  );
                }
              }
            } catch {
              localStorage.removeItem(
                SESSION_KEY
              );
            }
          }

          /*
           * Егер user бар болса,
           * Supabase-тан қайта тексереміз.
           */
          const savedAgain =
            localStorage.getItem(
              SESSION_KEY
            );

          if (
            savedAgain
          ) {
            try {
              const parsed =
                JSON.parse(
                  savedAgain
                );

              if (
                parsed?.id
              ) {
                const {
                  data,
                  error,
                } =
                  await supabase
                    .from(
                      "profiles"
                    )
                    .select("*")
                    .eq(
                      "id",
                      parsed.id
                    )
                    .maybeSingle();

                if (
                  !cancelled
                ) {
                  if (
                    error
                  ) {
                    console.error(
                      tr(
                        "profileRefreshError"
                      ),
                      error
                    );
                  } else if (
                    data
                  ) {
                    const freshUser =
                      mapProfile(
                        data
                      );

                    setUser(
                      freshUser
                    );

                    localStorage.setItem(
                      SESSION_KEY,
                      JSON.stringify(
                        freshUser
                      )
                    );
                  } else {
                    /*
                     * Profile жоқ болса
                     * ескі session өшеді.
                     */
                    localStorage.removeItem(
                      SESSION_KEY
                    );

                    setUser(
                      null
                    );
                  }
                }
              }
            } catch (
              error
            ) {
              console.error(
                tr(
                  "sessionRefreshError"
                ),
                error
              );
            }
          }
        } finally {
          if (
            !cancelled
          ) {
            setReady(
              true
            );
          }
        }
      };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===================================================
     FIND BY PHONE
  =================================================== */

  const findByPhone =
    async (
      phone: string
    ): Promise<User | null> => {
      const normalizedPhone =
        normalizePhone(
          phone
        );

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq(
          "phone",
          normalizedPhone
        )
        .maybeSingle();

      if (error) {
        console.error(
          tr(
            "findByPhoneError"
          ),
          error
        );

        return null;
      }

      return data
        ? mapProfile(data)
        : null;
    };

  /* ===================================================
     LOGIN
  =================================================== */

  const loginExisting =
    (u: User) => {
      if (
        u.status ===
        "blocked"
      ) {
        throw new Error(
          tr(
            "blockedAccount"
          )
        );
      }

      persist(u);
    };

  /* ===================================================
     REGISTER
  =================================================== */

  const register: AuthCtx["register"] =
    async (data) => {
      const normalizedPhone =
        normalizePhone(
          data.phone
        );

      const {
        data: profile,
        error,
      } =
        await supabase
          .from("profiles")
          .insert({
            phone:
              normalizedPhone,

            full_name:
              data.full_name,

            company_name:
              data.company_name ||
              null,

            role:
              data.role,

            status:
              "active",
          })
          .select("*")
          .single();

      if (error) {
        console.error(
          tr(
            "registerError"
          ),
          error
        );

        throw new Error(
          error.message
        );
      }

      /*
       * Cargo owner үшін де
       * бұрынғы логика сақталады.
       */
      try {
        await startTrialSubscription(
          profile.id
        );
      } catch (
        error
      ) {
        console.error(
          tr(
            "trialError"
          ),
          error
        );
      }

      const newUser =
        mapProfile(
          profile
        );

      persist(
        newUser
      );

      return newUser;
    };

  /* ===================================================
     LOGOUT
  =================================================== */

  const logout =
    () => {
      persist(null);

      setHasActiveSub(
        false
      );
    };

  /* ===================================================
     SWITCH ROLE
  =================================================== */

  const switchRole =
    async (
      role: Role
    ) => {
      if (!user) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            role,
          })
          .eq(
            "id",
            user.id
          )
          .select("*")
          .single();

      if (error) {
        console.error(
          tr(
            "switchRoleError"
          ),
          error
        );

        throw new Error(
          error.message
        );
      }

      const updatedUser =
        mapProfile(
          data
        );

      persist(
        updatedUser
      );
    };

  /* ===================================================
     SUBSCRIPTION
  =================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const checkSubscription =
      async () => {
        if (!user) {
          setHasActiveSub(
            false
          );

          return;
        }

        /*
         * Cargo owner үшін
         * subscription қажет емес.
         */
        if (
          user.role ===
          "cargo_owner"
        ) {
          setHasActiveSub(
            true
          );

          return;
        }

        try {
          const active =
            await isSubscriptionActiveAsync(
              user.id
            );

          if (
            !cancelled
          ) {
            setHasActiveSub(
              active
            );
          }
        } catch (
          error
        ) {
          console.error(
            tr(
              "subscriptionError"
            ),
            error
          );

          if (
            !cancelled
          ) {
            setHasActiveSub(
              false
            );
          }
        }
      };

    checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ===================================================
     CONTEXT
  =================================================== */

  return (
    <Ctx.Provider
      value={{
        user,
        ready,

        hasActiveSub,

        findByPhone,

        loginExisting,

        register,

        logout,

        switchRole,

        refresh: () =>
          setTick(
            (t) =>
              t + 1
          ),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/* =====================================================
   USE AUTH
===================================================== */

export function useAuth() {
  const ctx =
    useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}