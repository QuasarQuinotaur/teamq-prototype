import {useOutletContext} from "react-router-dom";
import type {MainContext} from "@/components/auth/hooks/create-main-context.tsx";

/**
 * Gets the current active MainContext.
 * This context is used as a shared reference for the current visit on the site.
 * Any data updated here doesn't save to backend.
 * Example usage: we remember if user is in `List` or `Grid` view when switching tabs.
 * */
export default function useMainContext() {
    return useOutletContext<MainContext>()
}