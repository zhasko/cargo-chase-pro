import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { kzt, shortDate } from "@/lib/format";
import { adminStats, listUsers, listComplaints, listAdminLogs, setUserBlocked } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

type Tab = "dashboard" | "users" | "complaints" | "logs";

function Admin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) navigate({ to: "/" });
  }, [ready, user, navigate]);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: adminStats });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const complaints = useQuery({ queryKey: ["admin-complaints"], queryFn: listComplaints });
  const logs = useQuery({ queryKey: ["admin-logs"], queryFn: listAdminLogs });

  if (!user || user.role !== "admin") return null;

  const toggleBlock = async (id: string, blocked: boolean) => {
    await setUserBlocked(id, blocked);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success(t("common.success"));
  };

  const tabs: { k: Tab; label: string }[] = [
    { k: "dashboard", label: t("admin.dashboard") },
    { k: "users", label: t("admin.users") },
    { k: "complaints", label: t("admin.complaints") },
    { k: "logs", label: t("admin.logs") },
  ];

  const s = stats.data;
  const cards = s ? [
    { label: t("admin.clients"), val: s.clients },
    { label: t("admin.drivers"), val: s.drivers },
    { label: t("admin.activeOrders"), val: s.activeOrders },
    { label: t("admin.archivedOrders"), val: s.archivedOrders },
    { label: t("admin.activeSearches"), val: s.activeSearches },
    { label: t("admin.activeSubs"), val: s.activeSubs },
    { label: t("admin.revenue"), val: kzt(s.revenue) },
    { label: t("admin.complaints"), val: s.complaints },
  ] : [];

  return (
    <div style={{ minHeight: "100vh" }}>
      <aside className="admin-sidebar">
        <div className="logo"><div className="logo-icon">A</div> ARGO</div>
        {tabs.map((x) => (
          <button key={x.k} className={`admin-nav-item${tab === x.k ? " active" : ""}`} onClick={() => setTab(x.k)}>
            <Icon.shield /> {x.label}
          </button>
        ))}
        <button className="admin-nav-item" onClick={() => navigate({ to: "/" })} style={{ marginTop: "auto" }}>
          <Icon.logout /> {t("common.back")}
        </button>
      </aside>

      <main className="admin-main admin-main-mobile-pad">
        <div className="tabs" style={{ display: "flex", flexWrap: "wrap", marginBottom: 20 }}>
          {tabs.map((x) => <button key={x.k} className={`tab${tab === x.k ? " active" : ""}`} onClick={() => setTab(x.k)}>{x.label}</button>)}
        </div>

        {tab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {cards.map((c) => (
              <div className="stat-card" key={c.label}>
                <div className="stat-val">{c.val}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>{t("auth.fullName")}</th><th>{t("profile.phone")}</th><th>{t("profile.role")}</th><th></th></tr></thead>
              <tbody>
                {(users.data ?? []).map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.phone}</td>
                    <td><span className="chip">{u.role}</span></td>
                    <td>
                      {u.status === "blocked" ? (
                        <button className="btn accent" style={{ padding: "5px 12px" }} onClick={() => toggleBlock(u.id, false)}>{t("admin.unblock")}</button>
                      ) : (
                        <button className="btn danger" style={{ padding: "5px 12px" }} onClick={() => toggleBlock(u.id, true)}>{t("admin.block")}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "complaints" && (
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>{t("complaint.reason")}</th><th>{t("common.view")}</th><th>{t("common.success")}</th></tr></thead>
              <tbody>
                {(complaints.data ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>{t(`complaint.${c.reason}`)}</td>
                    <td>{c.target_type} #{c.target_id}</td>
                    <td><span className="chip">{t(`complaint.status_${c.status}`)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "logs" && (
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>Action</th><th>Entity</th><th>Date</th></tr></thead>
              <tbody>
                {(logs.data ?? []).map((l) => (
                  <tr key={l.id}><td>{l.action}</td><td>{l.entity_type} #{l.entity_id}</td><td>{shortDate(l.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
