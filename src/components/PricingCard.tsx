import { useI18n } from "@/lib/i18n";
import { Icon } from "./icons";

export function PricingCard({
  title,
  price,
  period,
  features,
  cta,
  best,
  badge,
  onSelect,
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  best?: boolean;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <div className={`plan-card${best ? " best" : ""}`}>
      {badge && <div className="plan-badge">{badge}</div>}
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
        <span className="plan-price">{price}</span>
        {period && <span className="text-muted" style={{ fontSize: 14, fontWeight: 700 }}>{period}</span>}
      </div>
      <div style={{ marginTop: 16 }}>
        {features.map((f) => (
          <div className="plan-feature" key={f}>
            <span style={{ color: "var(--success)" }}><Icon.check style={{ width: 16, height: 16 }} /></span>
            {f}
          </div>
        ))}
      </div>
      <button className={`btn ${best ? "accent" : "primary"} w-full`} style={{ width: "100%", marginTop: 20 }} onClick={onSelect}>
        {cta}
      </button>
    </div>
  );
}
