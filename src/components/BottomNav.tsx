import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { Icon, type IconName } from "./icons";

interface NavItem {
  to: string;
  labelKey: string;
  icon: IconName;
  big?: boolean;
}

export function BottomNav() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isDriver = user?.role === "driver";

  const items: NavItem[] = isDriver
    ? [
        { to: "/", labelKey: "nav.home", icon: "home" },
        { to: "/orders", labelKey: "nav.orders", icon: "package" },
        { to: "/trucks/new", labelKey: "nav.addTruck", icon: "plus", big: true },
        { to: "/notifications", labelKey: "nav.notifications", icon: "bell" },
        { to: "/profile", labelKey: "nav.profile", icon: "user" },
      ]
    : [
        { to: "/", labelKey: "nav.home", icon: "home" },
        { to: "/my-cargo", labelKey: "nav.myCargo", icon: "boxes" },
        { to: "/orders/new", labelKey: "nav.addCargo", icon: "plus", big: true },
        { to: "/trucks", labelKey: "nav.trucks", icon: "truck" },
        { to: "/profile", labelKey: "nav.profile", icon: "user" },
      ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((it) => {
          const Comp = Icon[it.icon];
          const active = pathname === it.to || pathname.startsWith(it.to + "/");

          if (it.big) {
            return (
              <button
                key={it.to}
                type="button"
                aria-label={t(it.labelKey)}
                className="bn-item bn-big"
                onClick={() => navigate({ to: it.to as any })}
              >
                <div className="bn-icon-wrap">
                  <Icon.plus
                    className="bn-icon bn-plus-icon"
                    style={{
                      width: 30,
                      height: 30,
                      color: "#111827",
                      stroke: "#111827",
                      strokeWidth: 3,
                      display: "block",
                    }}
                  />
                </div>
              </button>
            );
          }

          return (
            <button
              key={it.to}
              type="button"
              className={`bn-item${active ? " active" : ""}`}
              onClick={() => navigate({ to: it.to as any })}
            >
              <Comp className="bn-icon" />
              <span>{t(it.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}