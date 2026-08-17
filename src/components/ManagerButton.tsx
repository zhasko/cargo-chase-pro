import { Icon } from "./icons";

const MANAGER_PHONE = "7011250468";

export function ManagerButton() {
  const whatsappUrl = `https://wa.me/${MANAGER_PHONE}?text=${encodeURIComponent(
    "Сәлеметсіз бе! ARGO бойынша менеджермен байланысқым келеді."
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="argo-manager-button"
      aria-label="Менеджермен WhatsApp арқылы байланысу"
      title="Менеджермен байланысу"
    >
      <span className="argo-manager-pulse" />

      <span className="argo-manager-icon">
        <Icon.phone />
      </span>
    </a>
  );
}