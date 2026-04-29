import { useLocation } from "react-router-dom";

export type AppPathPrefix = "/documents" | "/tutorial";

/**
 * Routes under `/tutorial/*` mirror `/documents/*`; use this for links and navigate
 * so service-request flows work in both layouts.
 */
export function useAppPathPrefix(): AppPathPrefix {
  const { pathname } = useLocation();
  return pathname.startsWith("/tutorial") ? "/tutorial" : "/documents";
}
