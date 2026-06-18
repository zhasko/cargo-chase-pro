import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Жиі қойылатын сұрақтар — ARGO" },
      { name: "description", content: "ARGO логистика алаңы туралы жиі қойылатын сұрақтар мен жауаптар." },
      { property: "og:title", content: "FAQ — ARGO" },
      { property: "og:description", content: "ARGO туралы жиі қойылатын сұрақтар." },
    ],
  }),
  component: Faq,
});

const FAQS = [
  { q: { kk: "ARGO қалай жұмыс істейді?", ru: "Как работает ARGO?", en: "How does ARGO work?" }, a: { kk: "Жүк иелері жүк жариялайды, жүргізушілер оларды тауып тікелей хабарласады. Комиссиясыз.", ru: "Грузовладельцы публикуют грузы, водители находят их и связываются напрямую. Без комиссии.", en: "Cargo owners post cargo, drivers find it and contact them directly. No commission." } },
  { q: { kk: "Тіркелу тегін бе?", ru: "Регистрация бесплатна?", en: "Is registration free?" }, a: { kk: "Иә. Жүк иелеріне толығымен тегін. Жүргізушілерге 30 күн тегін сынақ кезеңі бар.", ru: "Да. Для грузовладельцев полностью бесплатно. У водителей 30 дней бесплатного периода.", en: "Yes. Free for cargo owners. Drivers get a 30-day free trial." } },
  { q: { kk: "Телефонды кім көре алады?", ru: "Кто видит телефон?", en: "Who can see the phone?" }, a: { kk: "Тек тіркелген, белсенді жазылымы бар жүргізушілер. Қонақтарға телефон көрсетілмейді.", ru: "Только водители с активной подпиской. Гостям телефон не показывается.", en: "Only drivers with an active subscription. Guests cannot see phone numbers." } },
  { q: { kk: "Жүк қанша уақыт тұрады?", ru: "Сколько хранится груз?", en: "How long does a cargo stay active?" }, a: { kk: "Жүк 15 күн белсенді тұрады, содан кейін архивке өтеді. Оны қайта жариялауға болады.", ru: "Груз активен 15 дней, затем уходит в архив. Его можно опубликовать заново.", en: "A cargo stays active for 15 days, then is archived. It can be re-published." } },
  { q: { kk: "Жазылым қанша тұрады?", ru: "Сколько стоит подписка?", en: "How much is the subscription?" }, a: { kk: "Айлық — 4 990 ₸, жылдық — 49 900 ₸.", ru: "Месяц — 4 990 ₸, год — 49 900 ₸.", en: "Monthly — 4,990 ₸, yearly — 49,900 ₸." } },
];

function Faq() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<number>(-1);
  return (
    <AppShell width="medium">
      <h1 className="page-title">{t("nav.faq")}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {FAQS.map((f, i) => (
          <div className="faq-item" key={i}>
            <div className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              {f.q[lang]}
              <Icon.chevronToggle style={{ width: 16, height: 16, transform: open === i ? "rotate(180deg)" : "none", transition: ".2s" }} />
            </div>
            {open === i && <div className="faq-a">{f.a[lang]}</div>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
