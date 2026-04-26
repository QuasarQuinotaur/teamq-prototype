// Creates main context to use on per-website visit

import {useCallback, useEffect, useRef, useState} from "react";
import { getStoredView } from "@/lib/theme.ts";
import type { Role } from "db";

export type MainContext = {
    view: ViewType,
    setView: (view: ViewType) => void,
    favoritesOpen: boolean,
    setFavoritesOpen: (favoritesOpen: boolean) => void,
    tagsEnabled: boolean,
    setTagsEnabled: (tagsEnabled: boolean) => void,
    jobInfoMap: Record<string, Role>,
    rolesLoading: boolean
}
export type ViewType = "List" | "Grid"


/**
 * Creates a MainContext to use for shared per-visit state across logged-in website.
 */
export default function useCreateMainContext(): MainContext {
    const [view, setView] = useState<ViewType>(getStoredView);
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    const [tagsEnabled, setTagsEnabled] = useState(true);

    // Putting this here makes it so we only have to fetch roles once, and store them for each component
    const useJobInfoMap = useCallback(() => {
        const [jobInfoMap, setJobInfoMap] = useState<Record<string, Role>>({})
        const [rolesLoading, setRolesLoading] = useState(true)
        useEffect(() => {
            const fetchRoles = async () => {
                try {
                    setRolesLoading(true)
                    console.log("FETCH ROLES.")
                    const rolesResponse = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/roles`,
                        {credentials: "include"}
                    );
                    const rolesData = await rolesResponse.json()
                    if (!rolesData.success) throw new Error("Failed to find tags.")
                    const roles: Role[] = rolesData.roles
                    const roleMap = roles.reduce((map, role) => {
                        map[role.key] = role
                        return map
                    }, {})
                    console.log("ROLE MAP:", roleMap)
                    setJobInfoMap(roleMap)
                    setRolesLoading(false)
                } catch (error) {
                    console.error(error)
                }
            }
            void fetchRoles();
        }, [])
        return { jobInfoMap, rolesLoading }
    }, [])
    const { jobInfoMap, rolesLoading } = useJobInfoMap();

    return {
        view,
        setView,
        favoritesOpen,
        setFavoritesOpen,
        tagsEnabled,
        setTagsEnabled,
        jobInfoMap,
        rolesLoading
    }
}