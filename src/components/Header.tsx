import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { Icon, type IconName } from "./icons";
import { initials } from "@/lib/format";
import { updateUserRole, uploadAvatar } from "@/lib/services";
import type { Lang } from "@/lib/types";

const NAV = [
  { to: "/", key: "home" },
  { to: "/orders", key: "orders" },
  { to: "/trucks", key: "trucks" },
  { to: "/pricing", key: "pricing" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
] as const;

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const login = () => {
    navigate({
      to: "/auth",
      search: { redirect: pathname },
    });
  };

  /*
   * ============================================
   * ADMIN CHECK
   * ============================================
   *
   * Тек is_admin = true болған адам ғана
   * Admin батырмасын көреді.
   */
  const isAdmin = user?.is_admin === true;

  /*
   * ============================================
   * ESC + BODY SCROLL
   * ============================================
   */
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const go = (to: string) => {
    closeMenu();
    navigate({
      to: to as any,
    });
  };

  const isDriver = user?.role === "driver";

  /*
   * ============================================
   * PROFILE MENU
   * ============================================
   */

  const items: {
    to: string;
    label: string;
    icon: IconName;
    variant?: string;
  }[] = isDriver
    ? [
        {
          to: "/orders",
          label: "Жүк іздеу",
          icon: "boxes",
          variant: "accent",
        },
        {
          to: "/my-truck",
          label: t("profile.myTruck"),
          icon: "truck",
          variant: "accent",
        },
        {
          to: "/favorites",
          label: t("profile.favorites"),
          icon: "heart",
          variant: "accent",
        },
        {
          to: "/subscription",
          label: t("profile.subscription"),
          icon: "star",
          variant: "accent",
        },
        {
          to: "/settings",
          label: t("profile.settings"),
          icon: "settings",
          variant: "accent",
        },
      ]
    : [
        {
          to: "/orders/new",
          label: t("nav.addCargo"),
          icon: "plus",
          variant: "accent",
        },
        {
          to: "/my-cargo",
          label: t("profile.myCargo"),
          icon: "boxes",
          variant: "accent",
        },
        {
          to: "/trucks",
          label: t("nav.trucks"),
          icon: "truck",
          variant: "accent",
        },
        {
          to: "/subscription",
          label: t("profile.subscription"),
          icon: "star",
          variant: "accent",
        },
        {
          to: "/settings",
          label: t("profile.settings"),
          icon: "settings",
          variant: "accent",
        },
      ];

  /*
   * ============================================
   * ROLE SWITCH
   * ============================================
   */

  const toggleRole = async () => {
    if (!user) return;

    const next = isDriver
      ? "cargo_owner"
      : "driver";

    try {
      await updateUserRole(user.id, next);

      switchRole(next);

      toast.success(
        next === "driver"
          ? "Жүргізуші режиміне ауыстыңыз"
          : "Жүк иесі режиміне ауыстыңыз"
      );
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Рөлді ауыстыру кезінде қате шықты"
      );
    }
  };

  /*
   * ============================================
   * AVATAR
   * ============================================
   */

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    try {
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Тек сурет файлын таңдаңыз"
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          "Сурет көлемі 5 MB-тан аспауы керек"
        );
        return;
      }

      setUploadingAvatar(true);

      const avatarUrl = await uploadAvatar(
        user.id,
        file
      );

      const updatedUser = {
        ...user,
        avatar_url: avatarUrl,
      };

      localStorage.setItem(
        "argo_session_v1",
        JSON.stringify(updatedUser)
      );

      window.location.reload();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Аватарды өзгерту мүмкін болмады"
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  /*
   * ============================================
   * LOGOUT
   * ============================================
   */

  const handleLogout = () => {
    closeMenu();

    logout();

    navigate({
      to: "/",
    });
  };

  return (
    <>
      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <header className="app-header">
        <div className="header-inner">

          {/* LEFT */}
          <div className="header-menu">
            {user ? (
              <button
                className={`menu-button${
                  menuOpen ? " open" : ""
                }`}
                onClick={() =>
                  setMenuOpen((v) => !v)
                }
                aria-label="Профиль менюі"
                aria-expanded={menuOpen}
                type="button"
              >
                <span />
                <span />
                <span />
              </button>
            ) : (
              <button
                className="btn primary"
                style={{
                  padding: "7px 16px",
                  fontSize: 13,
                }}
                onClick={login}
                type="button"
              >
                {t("common.login")}
              </button>
            )}
          </div>

          {/* LOGO */}
          <Link
            to="/"
            className="logo"
          >
            <div className="logo-icon">
              A
            </div>

            ARGO
          </Link>

          {/* RIGHT */}
          <div className="header-right">

            <select
              className="lang-select"
              value={lang}
              onChange={(e) =>
                setLang(
                  e.target.value as Lang
                )
              }
              aria-label="Language"
            >
              <option value="kk">
                ҚАЗ
              </option>

              <option value="ru">
                РУС
              </option>

              <option value="en">
                ENG
              </option>
            </select>

            {/* ================================= */}
            {/* ADMIN BUTTON */}
            {/* ================================= */}

            {isAdmin && (
              <button
                className="btn ghost"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={() =>
                  navigate({
                    to: "/admin",
                  })
                }
                type="button"
              >
                <Icon.shield />

                {t("nav.admin")}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ======================================== */}
      {/* BACKDROP */}
      {/* ======================================== */}

      <div
        className={`profile-drawer-backdrop${
          menuOpen ? " visible" : ""
        }`}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      {/* ======================================== */}
      {/* PROFILE DRAWER */}
      {/* ======================================== */}

      <aside
        className={`profile-drawer${
          menuOpen ? " open" : ""
        }`}
      >

        {/* HEADER */}
        <div className="profile-drawer-header">

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >

            {/* AVATAR */}
            <label
              className="profile-avatar drawer-avatar"
              style={{
                position: "relative",
                cursor: uploadingAvatar
                  ? "default"
                  : "pointer",
                overflow: "hidden",

                width: 52,
                height: 52,
                minWidth: 52,
                minHeight: 52,

                borderRadius: "50%",
                flexShrink: 0,

                display: "block",
              }}
            >

              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  style={{
                    position: "absolute",
                    inset: 0,

                    width: "100%",
                    height: "100%",

                    minWidth: "100%",
                    minHeight: "100%",

                    maxWidth: "none",
                    maxHeight: "none",

                    objectFit: "cover",
                    objectPosition:
                      "50% 50%",

                    display: "block",
                    margin: 0,
                    padding: 0,
                    border: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {initials(
                    user?.full_name || ""
                  )}
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleAvatarChange
                }
                disabled={
                  uploadingAvatar
                }
                style={{
                  display: "none",
                }}
              />

              <div
                className="avatar-upload-overlay"
                style={{
                  position: "absolute",
                  inset: 0,

                  background:
                    "rgba(0,0,0,0.45)",

                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",

                  opacity: 0,

                  transition:
                    "opacity 0.2s",

                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,

                  borderRadius: "50%",
                }}
              >
                {uploadingAvatar
                  ? "..."
                  : "Фото"}
              </div>

            </label>

            {/* USER INFO */}
            <div
              style={{
                minWidth: 0,
              }}
            >

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,

                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {user?.full_name}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color:
                    "var(--muted)",
                  marginTop: 2,
                }}
              >
                ID:{" "}
                {user?.public_id ??
                  "null"}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color:
                    "var(--muted)",
                  marginTop: 2,
                }}
              >
                {user?.phone}
              </div>

              <span
                className="chip accent"
                style={{
                  marginTop: 6,
                  display:
                    "inline-flex",
                }}
              >
                {isDriver
                  ? t(
                      "auth.roleDriver"
                    )
                  : t(
                      "auth.roleOwner"
                    )}
              </span>

              {/* ADMIN STATUS */}
              {isAdmin && (
                <span
                  className="chip"
                  style={{
                    marginTop: 6,
                    marginLeft: 6,
                    display:
                      "inline-flex",
                    background:
                      "#c0e040",
                    color:
                      "#1a1c28",
                    fontWeight: 900,
                  }}
                >
                  ADMIN
                </span>
              )}

            </div>
          </div>

          {/* CLOSE */}
          <button
            className="drawer-close"
            onClick={closeMenu}
            type="button"
            aria-label="Жабу"
          >
            ×
          </button>

        </div>

        {/* ====================================== */}
        {/* MENU ITEMS */}
        {/* ====================================== */}

        <div className="profile-drawer-content">

          {items.map((it) => {
            const Comp =
              Icon[it.icon];

            return (
              <button
                key={it.to}
                className="profile-menu-item"
                onClick={() =>
                  go(it.to)
                }
                type="button"
              >

                <div
                  className={`profile-menu-icon${
                    it.variant
                      ? ` ${it.variant}`
                      : ""
                  }`}
                >
                  <Comp />
                </div>

                <span
                  style={{
                    fontWeight: 700,
                    flex: 1,
                    textAlign:
                      "left",
                  }}
                >
                  {it.label}
                </span>

                <Icon.arrow
                  style={{
                    width: 16,
                    height: 16,
                    color:
                      "var(--muted)",
                  }}
                />

              </button>
            );
          })}

          {/* ================================= */}
          {/* ADMIN PANEL */}
          {/* ================================= */}

          {isAdmin && (
            <button
              className="profile-menu-item"
              onClick={() =>
                go("/admin")
              }
              type="button"
            >
              <div
                className="profile-menu-icon"
                style={{
                  background:
                    "#c0e040",
                  color:
                    "#1a1c28",
                }}
              >
                <Icon.shield />
              </div>

              <span
                style={{
                  fontWeight: 800,
                  flex: 1,
                  textAlign:
                    "left",
                }}
              >
                Админ панель
              </span>

              <Icon.arrow
                style={{
                  width: 16,
                  height: 16,
                  color:
                    "var(--muted)",
                }}
              />
            </button>
          )}

          {/* ROLE SWITCH */}
          <button
            className="profile-menu-item"
            onClick={toggleRole}
            type="button"
          >
            <div className="profile-menu-icon dark">
              <Icon.swap />
            </div>

            <span
              style={{
                fontWeight: 700,
                flex: 1,
                textAlign:
                  "left",
              }}
            >
              {t(
                "profile.switchRole"
              )}
            </span>

            <Icon.arrow
              style={{
                width: 16,
                height: 16,
                color:
                  "var(--muted)",
              }}
            />
          </button>

          {/* LOGOUT */}
          <button
            className="profile-menu-item"
            onClick={handleLogout}
            type="button"
          >
            <div className="profile-menu-icon danger">
              <Icon.logout />
            </div>

            <span
              style={{
                fontWeight: 700,
                flex: 1,
                textAlign:
                  "left",
                color:
                  "var(--danger)",
              }}
            >
              {t(
                "common.logout"
              )}
            </span>
          </button>

        </div>
      </aside>
    </>
  );
}