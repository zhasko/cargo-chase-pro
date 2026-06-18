import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { createComplaint } from "@/lib/services";
import type { Complaint, ComplaintReason } from "@/lib/types";
import { Icon } from "./icons";

const REASONS: ComplaintReason[] = ["fake_order", "no_answer", "wrong_info", "fraud", "other"];

export function ComplaintModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: Complaint["target_type"];
  targetId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [reason, setReason] = useState<ComplaintReason>("no_answer");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    await createComplaint({ user_id: user.id, target_type: targetType, target_id: targetId, reason, description: description || undefined });
    setBusy(false);
    toast.success(t("complaint.submitted"));
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>{t("complaint.title")}</h2>
          <button className="fav-btn" onClick={onClose}><Icon.x /></button>
        </div>
        <label className="step-label active" style={{ display: "block", marginTop: 18 }}>{t("complaint.reason")}</label>
        <select className="input" style={{ marginTop: 6 }} value={reason} onChange={(e) => setReason(e.target.value as ComplaintReason)}>
          {REASONS.map((r) => <option key={r} value={r}>{t(`complaint.${r}`)}</option>)}
        </select>
        <label className="step-label active" style={{ display: "block", marginTop: 14 }}>{t("complaint.description")}</label>
        <textarea className="input" style={{ marginTop: 6, minHeight: 90, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn primary" style={{ flex: 1 }} disabled={busy} onClick={submit}>{t("complaint.submit")}</button>
        </div>
      </div>
    </div>
  );
}
