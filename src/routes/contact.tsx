import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Байланыс — ARGO" },
      { name: "description", content: "ARGO қолдау қызметімен байланысыңыз. Телефон, WhatsApp, email." },
      { property: "og:title", content: "Байланыс — ARGO" },
      { property: "og:description", content: "ARGO командасымен байланысыңыз." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", message: "" });

  const send = () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error(t("common.required"));
      return;
    }
    toast.success(t("common.success"));
    setForm({ name: "", message: "" });
  };

  return (
    <AppShell width="medium">
      <h1 className="page-title">{t("nav.contact")}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
        <a className="contact-card" href="tel:+77000000000">
          <div className="benefit-icon" style={{ width: 38, height: 38 }}><Icon.phone style={{ width: 18, height: 18 }} /></div>
          <div style={{ fontWeight: 800, marginTop: 12 }}>Телефон</div>
          <div className="text-muted" style={{ fontSize: 13 }}>+7 700 000 0000</div>
        </a>
        <a className="contact-card" href="https://wa.me/77000000000" target="_blank" rel="noreferrer">
          <div className="benefit-icon" style={{ width: 38, height: 38 }}><Icon.phone style={{ width: 18, height: 18 }} /></div>
          <div style={{ fontWeight: 800, marginTop: 12 }}>WhatsApp</div>
          <div className="text-muted" style={{ fontSize: 13 }}>+7 700 000 0000</div>
        </a>
        <a className="contact-card" href="mailto:support@argo.kz">
          <div className="benefit-icon" style={{ width: 38, height: 38 }}><Icon.bell style={{ width: 18, height: 18 }} /></div>
          <div style={{ fontWeight: 800, marginTop: 12 }}>Email</div>
          <div className="text-muted" style={{ fontSize: 13 }}>support@argo.kz</div>
        </a>
      </div>
    </AppShell>
  );
}
