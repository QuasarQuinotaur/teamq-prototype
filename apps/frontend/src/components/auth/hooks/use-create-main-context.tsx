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
    rolesLoading: boolean,
    refetchRoles: () => void,
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
        const [updateRoles, setUpdateRoles] = useState(true)
        const refetchRoles = useCallback(() => {
            setUpdateRoles(true)
        }, [setUpdateRoles])
        useEffect(() => {
            const fetchRoles = async () => {
                console.log("RE-FETCH ROLES NOW!!!")
                try {
                    if (updateRoles) {
                        setUpdateRoles(false)
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
                        setJobInfoMap(roleMap)
                        setRolesLoading(false)
                    }
                } catch (error) {
                    console.error(error)
                }
            }
            void fetchRoles();
        }, [updateRoles])
        return { jobInfoMap, rolesLoading, refetchRoles }
    }, [])
    const { jobInfoMap, rolesLoading, refetchRoles } = useJobInfoMap();

    return {
        view,
        setView,
        favoritesOpen,
        setFavoritesOpen,
        tagsEnabled,
        setTagsEnabled,
        jobInfoMap,
        rolesLoading,
        refetchRoles
    }
}