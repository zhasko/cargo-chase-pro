import type { ReactNode } from "react";
import { Header } from "./Header";
import { SubscriptionIsland } from "./SubscriptionIsland";
import { ManagerButton } from "./ManagerButton";

export function AppShell({
  children,
  width,
}: {
  children: ReactNode;
  width?: "narrow" | "medium";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />

      <main style={{ flex: 1 }}>
        <div
          className={`page${
            width ? " " + width : ""
          }`}
        >
          {children}
        </div>
      </main>

      {/* 
        ARGO subscription island.
        Барлық бетте көрсетіледі.
      */}
      <SubscriptionIsland />
      <ManagerButton />
    </div>
  );
}

export function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className="back-btn"
      onClick={onClick}
    >
      ← {label}
    </button>
  );
}