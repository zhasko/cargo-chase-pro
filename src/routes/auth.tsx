import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import type { Lang, Role } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Кіру — ARGO" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

type Step = "phone" | "otp" | "role" | "register" | "done";

function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const { findByPhone, loginExisting, register } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+7 ");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<Role>("cargo_owner");
  const [form, setForm] = useState({ full_name: "", company_name: "", vehicle_type: VEHICLE_TYPES[0], load_capacity: "", volume: "", current_city: CITIES[0] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = () => {
    if (phone.replace(/\D/g, "").length < 11) {
      setErrors({ phone: t("common.required") });
      return;
    }
    setErrors({});
    setStep("otp");
    toast.info(t("auth.demoHint"));
  };

  const verify = () => {
    if (otp.join("").length < 6) {
      toast.error(t("common.required"));
      return;
    }
    const existing = findByPhone(phone);
    if (existing) {
      loginExisting(existing);
      toast.success(t("common.success"));
      navigate({ to: existing.role === "admin" ? "/admin" : "/" });
    } else {
      setStep("role");
    }
  };

  const finishRegister = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = t("common.required");
    setErrors(e);
    if (Object.keys(e).length) return;
    register({ phone, full_name: form.full_name, role, company_name: form.company_name || undefined });
    setStep("done");
    setTimeout(() => navigate({ to: "/" }), 1400);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Link to="/" className="auth-logo">A</Link>
          <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="kk">ҚАЗ</option>
            <option value="ru">РУС</option>
            <option value="en">ENG</option>
          </select>
        </div>

        {step === "phone" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.welcome")}</h1>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{t("auth.phoneSub")}</p>
            <div style={{ marginTop: 20 }}>
              <label className="step-label active">{t("auth.phoneTitle")}</label>
              <input className="input" style={{ marginTop: 6 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("auth.phonePlaceholder")} inputMode="tel" />
              {errors.phone && <div className="text-danger" style={{ fontSize: 12, marginTop: 6 }}>{errors.phone}</div>}
            </div>
            <button className="btn primary w-full" style={{ width: "100%", marginTop: 20 }} onClick={sendCode}>{t("auth.sendCode")}</button>
            <p className="text-muted" style={{ fontSize: 11, marginTop: 16, textAlign: "center" }}>{t("auth.terms")}</p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.codeTitle")}</h1>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{t("auth.codeSub")} {phone}</p>
            <div className="otp-grid">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  className="otp-input"
                  value={d}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    const next = [...otp];
                    next[i] = v;
                    setOtp(next);
                    if (v && i < 5) otpRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                  }}
                />
              ))}
            </div>
            <button className="btn primary w-full" style={{ width: "100%", marginTop: 20 }} onClick={verify}>{t("auth.verify")}</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button className="back-btn" style={{ margin: 0 }} onClick={() => setStep("phone")}>{t("auth.changePhone")}</button>
              <button className="back-btn" style={{ margin: 0 }} onClick={() => toast.info(t("auth.demoHint"))}>{t("auth.resend")}</button>
            </div>
          </>
        )}

        {step === "role" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.roleTitle")}</h1>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{t("auth.roleSub")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button className="role-card" onClick={() => { setRole("cargo_owner"); setStep("register"); }}>
                <div className="role-icon accent"><Icon.package /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>{t("auth.roleOwner")}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{t("auth.roleOwnerDesc")}</div>
                </div>
              </button>
              <button className="role-card" onClick={() => { setRole("driver"); setStep("register"); }}>
                <div className="role-icon dark"><Icon.truck /></div>
                <div>
                  <div style={{ fontWeight: 800 }}>{t("auth.roleDriver")}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{t("auth.roleDriverDesc")}</div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "register" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.regTitle")}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
              <div>
                <input className="input" placeholder={t("auth.fullName")} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                {errors.full_name && <div className="text-danger" style={{ fontSize: 12, marginTop: 6 }}>{errors.full_name}</div>}
              </div>
              <input className="input" placeholder={t("auth.companyName")} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              {role === "driver" && (
                <>
                  <select className="input" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                    {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
                  </select>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input className="input" type="number" placeholder={t("auth.capacity")} value={form.load_capacity} onChange={(e) => setForm({ ...form, load_capacity: e.target.value })} />
                    <input className="input" type="number" placeholder={t("auth.volume")} value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
                  </div>
                  <select className="input" value={form.current_city} onChange={(e) => setForm({ ...form, current_city: e.target.value })}>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </>
              )}
            </div>
            <button className="btn primary w-full" style={{ width: "100%", marginTop: 20 }} onClick={finishRegister}>{t("auth.finish")}</button>
            <button className="back-btn" style={{ marginTop: 14 }} onClick={() => setStep("role")}>← {t("common.back")}</button>
          </>
        )}

        {step === "done" && (
          <div className="success-screen">
            <div className="success-icon"><Icon.check style={{ width: 32, height: 32 }} /></div>
            <h1 style={{ fontSize: 20, fontWeight: 900 }}>{t("auth.created")}</h1>
          </div>
        )}
      </div>
    </div>
  );
}
