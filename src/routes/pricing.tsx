import {
  createFileRoute,
  Navigate,
} from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: PricingRedirect,
});

function PricingRedirect() {
  return <Navigate to="/subscription" replace />;
}