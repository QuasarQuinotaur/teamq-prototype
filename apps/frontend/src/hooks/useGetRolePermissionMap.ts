import useMainContext from '@/components/auth/hooks/main-context';
import type { Employee, Role } from 'db';
import { useMemo } from 'react';
import useGetPermissionLevel from './useGetPermissionLevel';

const PERMISSION_LEVEL_NAME_MAP: {[key: number]: string} = {
    [0]: "Employee",
    [1]: "Admin",
    [2]: "Owner",
}

export default function useGetRolePermissionMap() {
    const { getPermissionLevel, rolesLoading } = useGetPermissionLevel();
    const getRolePermissionMap = useMemo(() => {
        return (permissionLevel: number, viewingPermissionLevel?: number): {[level: string]: string} => {
            return Object.keys(PERMISSION_LEVEL_NAME_MAP).filter(level => {
                const levelNum = Number(level)
                return permissionLevel > levelNum || (viewingPermissionLevel && levelNum === viewingPermissionLevel)
            }).reduce((map, level) => {
                map[level] = PERMISSION_LEVEL_NAME_MAP[Number(level)]
                return map
            }, {})
        }
    }, [getPermissionLevel])
    return { getRolePermissionMap, rolesLoading }
}