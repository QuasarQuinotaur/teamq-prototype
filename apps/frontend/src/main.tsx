import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { TooltipProvider } from "@/elements/tooltip.tsx"
import './index.css'
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="ahhhhhhhhhh.us.auth0.com"
      clientId="3w5wvfDcVGySmKc76ijFuhtdR2Gk3S3Q"
      authorizationParams={{ redirect_uri: "http://localhost:5173/documents" }}
    >
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </Auth0Provider>
  </StrictMode>,
)
