import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/lib/types";
import { uploadAvatar } from "@/lib/services";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, ready, switchRole, loginExisting } = useAuth();

  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    role: "cargo_owner" as Role,
  });

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/auth" });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;

    setForm({
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
      role: user.role,
    });
  }, [user]);

  const set = (p: Partial<typeof form>) => {
    setForm((prev) => ({
      ...prev,
      ...p,
    }));
  };

  // ==========================================
  // АВАТАР
  // ==========================================

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Тек сурет файлын таңдаңыз");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Сурет көлемі 5 MB-тан аспауы керек");
        return;
      }

      setAvatarBusy(true);

      const avatarUrl = await uploadAvatar(user.id, file);

      const { data, error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      loginExisting({
        id: data.id,
        public_id: data.public_id,
        phone: data.phone,
        full_name: data.full_name,
        company_name: data.company_name ?? undefined,
        role: data.role,
        status: data.status ?? "active",
        created_at: data.created_at,
        avatar_url: data.avatar_url ?? undefined,
        is_admin: data.is_admin === true,
      });

      toast.success("Аватар өзгертілді");
    } catch (e: any) {
      console.error("Avatar change error:", e);

      toast.error(
        e?.message || "Аватарды өзгерту мүмкін болмады"
      );
    } finally {
      setAvatarBusy(false);
      e.target.value = "";
    }
  };

  // ==========================================
  // САҚТАУ
  // ==========================================

  const save = async () => {
    if (!user) return;

    if (!form.full_name.trim()) {
      toast.error("Аты-жөніңізді енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          company_name:
            form.company_name.trim() || null,
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) throw error;

      const updatedUser = {
        id: data.id,
        public_id: data.public_id,
        phone: data.phone,
        full_name: data.full_name,
        company_name:
          data.company_name ?? undefined,
        role: data.role,
        status: data.status ?? "active",
        created_at: data.created_at,
        avatar_url:
          data.avatar_url ?? undefined,
      };

      if (form.role !== user.role) {
        await switchRole(form.role);

        loginExisting({
          ...updatedUser,
          role: form.role,
          is_admin: data.is_admin === true,
        });
      } else {
        loginExisting(updatedUser);
      }

      toast.success("Баптаулар сақталды");

      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(
        e?.message || "Сақтау кезінде қате шықты"
      );
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell width="narrow">
      {/* ==========================================
          MAIN CENTER WRAPPER
      ========================================== */}

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "0 16px 40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* BACK */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              width: "100%",
              marginBottom: 18,
            }}
          >
            <button
              className="back-btn"
              onClick={() =>
                navigate({ to: "/" })
              }
              type="button"
            >
              ← {t("common.back")}
            </button>
          </div>

          {/* ======================================
              TITLE
          ====================================== */}

          <div
            style={{
              width: "100%",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            <h1
              className="page-title"
              style={{
                margin: 0,
              }}
            >
              Баптаулар
            </h1>

            <p
              className="page-sub"
              style={{
                margin: "7px 0 0",
              }}
            >
              Профиль мәліметтерін өзгерту
            </p>
          </div>

          {/* ======================================
              CARD
          ====================================== */}

          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 560,
              margin: "0 auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              padding: 24,
            }}
          >
            {/* ==================================
                AVATAR
            ================================== */}

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "4px 0 14px",
              }}
            >
              <label
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 110,
                  height: 110,
                  margin: "0 auto",
                  cursor: avatarBusy
                    ? "default"
                    : "pointer",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={avatarBusy}
                  onChange={handleAvatarChange}
                />

                <div
                  className="profile-avatar"
                  style={{
                    width: 110,
                    height: 110,
                    minWidth: 110,
                    minHeight: 110,
                    borderRadius: "50%",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {user.avatar_url ? (
                    <img
    src={user.avatar_url}
    alt="Avatar"
    style={{
      position: "absolute",
      top: 0,
      left: 0,

      width: "100%",
      height: "100%",

      maxWidth: "none",
      maxHeight: "none",

      objectFit: "cover",
      objectPosition: "center",

      display: "block",
      margin: 0,
      padding: 0,
      border: 0,
    }}
  />
                  ) : (
                    initials(
                      user.full_name || ""
                    )
                  )}

                  {avatarBusy && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "rgba(0,0,0,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Жүктелуде...
                    </div>
                  )}
                </div>
              </label>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                Аватар
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                Суретті өзгерту үшін
                аватарға басыңыз
              </div>
            </div>

            {/* ==================================
                FORM
            ================================== */}

            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* АТЫ */}

              <label
                style={{
                  display: "block",
                  width: "100%",
                }}
              >
                <div
                  className="step-label active"
                  style={{
                    marginBottom: 7,
                  }}
                >
                  Аты-жөні
                </div>

                <input
                  className="input"
                  value={form.full_name}
                  onChange={(e) =>
                    set({
                      full_name:
                        e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              {/* КОМПАНИЯ */}

              <label
                style={{
                  display: "block",
                  width: "100%",
                }}
              >
                <div
                  className="step-label active"
                  style={{
                    marginBottom: 7,
                  }}
                >
                  Компания атауы
                </div>

                <input
                  className="input"
                  value={form.company_name}
                  onChange={(e) =>
                    set({
                      company_name:
                        e.target.value,
                    })
                  }
                  placeholder="Міндетті емес"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              {/* ТЕЛЕФОН */}

              <label
                style={{
                  display: "block",
                  width: "100%",
                }}
              >
                <div
                  className="step-label active"
                  style={{
                    marginBottom: 7,
                  }}
                >
                  Телефон
                </div>

                <input
                  className="input"
                  value={form.phone}
                  disabled
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />

                <p
                  className="text-muted"
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize: 12,
                  }}
                >
                  Телефон нөмірін өзгерту
                  мүмкін емес
                </p>
              </label>

              {/* РӨЛЬ */}

              <div
                style={{
                  width: "100%",
                }}
              >
                <div
                  className="step-label active"
                  style={{
                    marginBottom: 8,
                  }}
                >
                  Активті рөл
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 10,
                    width: "100%",
                  }}
                >
                  <button
                    type="button"
                    className={
                      form.role ===
                      "cargo_owner"
                        ? "btn primary"
                        : "btn ghost"
                    }
                    onClick={() =>
                      set({
                        role: "cargo_owner",
                      })
                    }
                    style={{
                      width: "100%",
                    }}
                  >
                    Жүк иесі
                  </button>

                  <button
                    type="button"
                    className={
                      form.role ===
                      "driver"
                        ? "btn primary"
                        : "btn ghost"
                    }
                    onClick={() =>
                      set({
                        role: "driver",
                      })
                    }
                    style={{
                      width: "100%",
                    }}
                  >
                    Жүргізуші
                  </button>
                </div>
              </div>

              {/* ==================================
                  ACCOUNT
              ================================== */}

              <div
                className="locked-box"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                }}
              >
                <div className="step-label active">
                  Аккаунт
                </div>

                <p
                  className="text-muted"
                  style={{
                    margin:
                      "7px 0 0",
                    fontSize: 13,
                  }}
                >
                  Тіркелген күні:{" "}
                  {new Date(
                    user.created_at
                  ).toLocaleDateString(
                    "kk-KZ"
                  )}
                </p>

                <p
                  className="text-muted"
                  style={{
                    margin:
                      "4px 0 0",
                    fontSize: 13,
                  }}
                >
                  ID:{" "}
                  {user.public_id ??
                    "берілмеген"}
                </p>
              </div>

              {/* SAVE */}

              <button
                className="btn accent"
                disabled={busy}
                onClick={save}
                type="button"
                style={{
                  width: "100%",
                  marginTop: 2,
                }}
              >
                {busy
                  ? "Сақталуда..."
                  : "Сақтау"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}