import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { initials } from "@/lib/format";
import { Icon } from "./icons";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const login = () => {
    navigate({
      to: "/auth",
      search: { redirect: pathname },
    });
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">A</div>
          ARGO
        </Link>

        <nav className="nav-links">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`nav-link${pathname === n.to ? " active" : ""}`}
            >
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="Language"
          >
            <option value="kk">ҚАЗ</option>
            <option value="ru">РУС</option>
            <option value="en">ENG</option>
          </select>

          {user?.role === "admin" && (
            <button
              className="btn ghost"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => navigate({ to: "/admin" })}
            >
              <Icon.shield /> {t("nav.admin")}
            </button>
          )}

          {user ? (
            <button className="user-btn" onClick={() => navigate({ to: "/profile" })}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: "var(--accent)",
                  color: "var(--accent-fg)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {initials(user.full_name)}
              </div>
              <span>{user.full_name}</span>
            </button>
          ) : (
            <button
              className="btn primary"
              style={{ padding: "7px 16px", fontSize: 13 }}
              onClick={login}
            >
              {t("common.login")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}