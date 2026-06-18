import { Icon } from "./icons";

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: keyof typeof Icon }) {
  const Comp = icon ? Icon[icon] : Icon.package;
  return (
    <div className="empty-state">
      <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--surface2)", display: "grid", placeItems: "center", color: "var(--muted)" }}>
          <Comp />
        </div>
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
