import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { TooltipProvider } from "@/elements/tooltip.tsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";
import { applyTheme, getStoredTheme } from "@/lib/theme.ts";
import { Toaster } from "sonner";

applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain="ahhhhhhhhhh.us.auth0.com"
      clientId="3w5wvfDcVGySmKc76ijFuhtdR2Gk3S3Q"
      authorizationParams={{ redirect_uri: `${window.location.origin}/documents` }}
    >
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster richColors />
      </TooltipProvider>
    </Auth0Provider>
  </StrictMode>
);
