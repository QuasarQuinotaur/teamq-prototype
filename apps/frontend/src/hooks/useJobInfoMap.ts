import type { Role } from 'db';
import { useEffect, useRef, useState } from 'react';

export default function useJobInfoMap() {
    const [jobInfoMap, setJobInfoMap] = useState<Record<string, Role>>({})
    const isFetched = useRef(false);
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                console.log("IS FETCHED?", isFetched.current)
                const rolesResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/roles`,
                    {credentials: "include"}
                );
                const rolesData = await rolesResponse.json()
                if (!rolesData.success) throw new Error("Failed to find tags.")
                const roles: Role[] = rolesData.roles
                const roleMap = roles.reduce((map, role) => {
                    map[role.id] = role
                    return map
                }, {})
                setJobInfoMap(roleMap)
                isFetched.current = true
            } catch (error) {
                console.error(error)
            }
        }
        void fetchRoles();
    }, [isFetched])
    return { jobInfoMap }
}