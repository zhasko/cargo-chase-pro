import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon, type IconName } from "@/components/icons";
import { initials } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { updateUserRole } from "@/lib/services";


export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Профиль — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready, logout, switchRole } = useAuth();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!user) return null;
  const isDriver = user.role === "driver";

  const items: { to: string; label: string; icon: IconName; variant?: string }[] = isDriver
    ? [
        { to: "/my-truck", label: t("profile.myTruck"), icon: "truck", variant: "accent" },
        { to: "/favorites", label: t("profile.favorites"), icon: "heart" },
        { to: "/subscription", label: t("profile.subscription"), icon: "star" },
        { to: "/payments", label: t("profile.payments"), icon: "credit" },
        { to: "/complaints", label: t("profile.complaints"), icon: "flag" },
        { to: "/settings", label: t("profile.settings"), icon: "settings" },
      ]
    : [
        { to: "/my-cargo", label: t("profile.myCargo"), icon: "boxes", variant: "accent" },
        { to: "/orders/new", label: t("nav.addCargo"), icon: "plus" },
        { to: "/complaints", label: t("profile.complaints"), icon: "flag" },
        { to: "/settings", label: t("profile.settings"), icon: "settings" },
      ];

const toggleRole = async () => {
  if (!user) return;

  const next = isDriver ? "cargo_owner" : "driver";

  await updateUserRole(user.id, next);
  switchRole(next);

  toast.success(
    next === "driver"
      ? "Жүргізуші режиміне ауыстыңыз"
      : "Жүк иесі режиміне ауыстыңыз"
  );
};

  return (
    <AppShell width="medium">
      <div className="profile-hero">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div className="profile-avatar">{initials(user.full_name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{user.full_name}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{user.phone}</div>
            <span className="chip accent" style={{ marginTop: 6 }}>{isDriver ? t("auth.roleDriver") : t("auth.roleOwner")}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {items.map((it) => {
          const Comp = Icon[it.icon];
          return (
            <button key={it.to} className="profile-menu-item" onClick={() => navigate({ to: it.to })}>
              <div className={`profile-menu-icon${it.variant ? " " + it.variant : ""}`}><Comp /></div>
              <span style={{ fontWeight: 700, flex: 1, textAlign: "left" }}>{it.label}</span>
              <Icon.arrow style={{ width: 16, height: 16, color: "var(--muted)" }} />
            </button>
          );
        })}

        <button className="profile-menu-item" onClick={toggleRole}>
          <div className="profile-menu-icon dark"><Icon.swap /></div>
          <span style={{ fontWeight: 700, flex: 1, textAlign: "left" }}>{t("profile.switchRole")}</span>
          <Icon.arrow style={{ width: 16, height: 16, color: "var(--muted)" }} />
        </button>

        <button className="profile-menu-item" onClick={() => { logout(); navigate({ to: "/" }); }}>
          <div className="profile-menu-icon danger"><Icon.logout /></div>
          <span style={{ fontWeight: 700, flex: 1, textAlign: "left", color: "var(--danger)" }}>{t("common.logout")}</span>
        </button>
      </div>
    </AppShell>
  );
}
