import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import type { Lang, Role } from "@/lib/types";


const AUTH_DRAFT_KEY = "argo_auth_draft_v1";
const WHATSAPP_BOT_NUMBER = "77011250468";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Кіру — ARGO" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Step = "phone" | "otp" | "register" | "role" | "done";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("8") && digits.length === 11) return "+7" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 11) return "+" + digits;
  if (digits.length === 10) return "+7" + digits;

  return value.startsWith("+") ? value : "+" + digits;
}

function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const { findByPhone, loginExisting, register } = useAuth();
  const search = useSearch({ from: "/auth" });
  const redirectTo = search.redirect || "/";
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+7 ");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<Role>("cargo_owner");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_DRAFT_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.step) setStep(parsed.step);
      if (parsed.role) setRole(parsed.role);
      if (parsed.form) setForm(parsed.form);
    } catch {
      localStorage.removeItem(AUTH_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      AUTH_DRAFT_KEY,
      JSON.stringify({
        phone,
        step,
        role,
        form,
      })
    );
  }, [phone, step, role, form]);

  const clearDraft = () => {
    localStorage.removeItem(AUTH_DRAFT_KEY);
  };

  const openWhatsappBot = (normalizedPhone: string) => {
    const returnUrl = `${window.location.origin}/auth`;

    const text = encodeURIComponent(
      `код`
    );

    window.open(`https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${text}`, "_blank");
  };

  const sendCode = async () => {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone.startsWith("+7") || normalizedPhone.length !== 12) {
      toast.error("Нөмірді +7 форматында енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.rpc("create_whatsapp_otp", {
        p_phone: normalizedPhone,
      });

      if (error) throw error;

      setPhone(normalizedPhone);
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");

      localStorage.setItem(
        AUTH_DRAFT_KEY,
        JSON.stringify({
          phone: normalizedPhone,
          step: "otp",
          role,
          form,
        })
      );

      openWhatsappBot(normalizedPhone);

      toast.success("WhatsApp ашылды. Дайын хабарламаны жіберіңіз");
    } catch (e: any) {
      console.error("create whatsapp otp error:", e);
      toast.error(e?.message || "Код жасау кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const token = otp.join("");
    const normalizedPhone = normalizePhone(phone);

    if (token.length !== 6) {
      toast.error("6 таңбалы кодты енгізіңіз");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.rpc("verify_whatsapp_otp", {
        p_phone: normalizedPhone,
        p_code: token,
      });

      if (error) throw error;

      if (!data) {
        toast.error("Код қате немесе мерзімі өтіп кеткен");
        return;
      }

      const existing = await findByPhone(normalizedPhone);

      if (existing) {
        loginExisting(existing);
        clearDraft();
        toast.success("Кіру сәтті өтті");
        navigate({ to: existing.role === "admin" ? "/admin" : redirectTo as any });
        return;
      }

      setPhone(normalizedPhone);
      setStep("register");
    } catch (e: any) {
      console.error("verify whatsapp otp error:", e);
      toast.error(e?.message || "Код тексеру кезінде қате шықты");
    } finally {
      setBusy(false);
    }
  };

  const goToRole = () => {
    const e: Record<string, string> = {};

    if (!form.full_name.trim()) {
      e.full_name = t("common.required");
    }

    setErrors(e);

    if (Object.keys(e).length) return;

    setStep("role");
  };

  const finishRegister = async (selectedRole: Role) => {
    setBusy(true);

    try {
      setRole(selectedRole);

      await register({
        phone: normalizePhone(phone),
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim() || undefined,
        role: selectedRole,
      });

      clearDraft();
      setStep("done");
      toast.success("Аккаунт құрылды");

      setTimeout(() => {
        navigate({ to: "/" });
      }, 800);
    } catch (e: any) {
      console.error("register error:", e);
      toast.error(e?.message || "Тіркелу кезінде қате шықты");
    } finally {
      setBusy(false);
    }
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

            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              Нөміріңізді енгізіңіз. Кодты WhatsApp бот арқылы аласыз.
            </p>

            <div style={{ marginTop: 20 }}>
              <label className="step-label active">{t("auth.phoneTitle")}</label>

              <input
                className="input"
                style={{ marginTop: 6 }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("auth.phonePlaceholder")}
                inputMode="tel"
              />
            </div>

            <button className="btn primary" style={{ width: "100%", marginTop: 20 }} disabled={busy} onClick={sendCode}>
              {busy ? t("common.loading") : "Кодты WhatsApp арқылы алу"}
            </button>

            <p className="text-muted" style={{ fontSize: 11, marginTop: 16, textAlign: "center" }}>
              Батырманы басқаннан кейін WhatsApp ашылады. Дайын тұрған “код” хабарламасын жіберіңіз.
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.codeTitle")}</h1>

            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              Код күтілуде: {phone}
            </p>

            <button
              className="btn accent"
              style={{ width: "100%", marginTop: 14 }}
              disabled={busy}
              onClick={() => openWhatsappBot(normalizePhone(phone))}
            >
              WhatsApp-қа қайта өту
            </button>

            <div className="otp-grid">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
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
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      otpRefs.current[i - 1]?.focus();
                    }
                  }}
                />
              ))}
            </div>

            <button className="btn primary" style={{ width: "100%", marginTop: 20 }} disabled={busy} onClick={verify}>
              {busy ? t("common.loading") : t("auth.verify")}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button className="back-btn" style={{ margin: 0 }} disabled={busy} onClick={() => setStep("phone")}>
                {t("auth.changePhone")}
              </button>

              <button className="back-btn" style={{ margin: 0 }} disabled={busy} onClick={sendCode}>
                {t("auth.resend")}
              </button>
            </div>
          </>
        )}

        {step === "register" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>Профиль деректері</h1>

            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              Аты-жөніңізді енгізіңіз. ИП немесе компания атауы міндетті емес.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
              <div>
                <input
                  className="input"
                  placeholder={t("auth.fullName")}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />

                {errors.full_name && (
                  <div className="text-danger" style={{ fontSize: 12, marginTop: 6 }}>
                    {errors.full_name}
                  </div>
                )}
              </div>

              <input
                className="input"
                placeholder="ИП / Компания атауы (міндетті емес)"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>

            <button className="btn primary" style={{ width: "100%", marginTop: 20 }} disabled={busy} onClick={goToRole}>
              Жалғастыру
            </button>

            <button className="back-btn" style={{ marginTop: 14 }} onClick={() => setStep("otp")}>
              ← {t("common.back")}
            </button>
          </>
        )}

        {step === "role" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("auth.roleTitle")}</h1>

            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              Қолданбаны қай рөлмен бастайсыз?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button className="role-card" disabled={busy} onClick={() => finishRegister("cargo_owner")}>
                <div className="role-icon accent">
                  <Icon.package />
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>{t("auth.roleOwner")}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("auth.roleOwnerDesc")}
                  </div>
                </div>
              </button>

              <button className="role-card" disabled={busy} onClick={() => finishRegister("driver")}>
                <div className="role-icon dark">
                  <Icon.truck />
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>{t("auth.roleDriver")}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("auth.roleDriverDesc")}
                  </div>
                </div>
              </button>
            </div>

            <button className="back-btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => setStep("register")}>
              ← {t("common.back")}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="success-screen">
            <div className="success-icon">
              <Icon.check style={{ width: 32, height: 32 }} />
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 900 }}>
              {t("auth.created")}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}