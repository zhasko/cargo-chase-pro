import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { CargoCard } from "@/components/CargoCard";
import { EmptyState } from "@/components/EmptyState";
import { useI18n } from "@/lib/i18n";
import { listOrders, listFavorites } from "@/lib/services";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Таңдаулылар — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: Favorites,
});

function Favorites() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);

  const { data } = useQuery({ queryKey: ["orders", "all-for-fav"], queryFn: () => listOrders({ sort: "new" }) });
  const favIds = listFavorites();
  const favs = (data ?? []).filter((o) => favIds.includes(o.id));

  return (
    <AppShell width="medium">
      <button className="back-btn" onClick={() => navigate({ to: "/profile" })}>← {t("common.back")}</button>
      <h1 className="page-title">{t("profile.favorites")}</h1>
      {favs.length === 0 ? (
        <EmptyState title={t("common.empty")} icon="heart" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 18 }}>
          {favs.map((o) => <CargoCard key={o.id} order={o} />)}
        </div>
      )}
    </AppShell>
  );
}
