import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/store";

export const Route = createFileRoute(
  "/argo-control"
)({
  head: () => ({
    meta: [
      {
        title: "ARGO Control",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: ArgoControl,
});

function ArgoControl() {
  const navigate = useNavigate();

  const {
    user,
    ready,
  } = useAuth();

 useEffect(() => {
  if (!ready) return;

  if (!user) {
    navigate({
      to: "/",
      replace: true,
    });
  }
}, [
  ready,
  user,
  navigate,
]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0d10",
          color: "#fff",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            ARGO
          </div>

          <div
            style={{
              opacity: 0.6,
              fontSize: 14,
            }}
          >
            Қауіпсіз кіру тексерілуде...
          </div>
        </div>
      </div>
    );
  }

  return null;
}