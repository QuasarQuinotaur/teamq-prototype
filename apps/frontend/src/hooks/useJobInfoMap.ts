import useMainContext from '@/components/auth/hooks/main-context';
import type { Role } from 'db';
import { useEffect, useRef, useState } from 'react';

export default function useJobInfoMap() {
    const context = useMainContext()
    return {
        jobInfoMap: context.jobInfoMap,
        rolesLoading: context.rolesLoading,
        refetchRoles: context.refetchRoles,
    }
}