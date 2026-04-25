import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Blocked from '@/pages/Blocked';
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import type { Employee } from 'db';
import useGetEmployeeIsAdmin from '@/hooks/useGetEmployeeIsAdmin';

interface RoleGuardProps {
  allowedRole?: string;
  onlyAdmins?: boolean;
}

export const RoleGuard = ({
    allowedRole,
    onlyAdmins
}: RoleGuardProps) => {
  const [status, setStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading');

  // Pass context down
  const mainContext = useMainContext()

  const getEmployeeIsAdmin = useGetEmployeeIsAdmin();

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    withCredentials: true,
  });

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await api.get('/me');
        const employee: Employee = response.data
        if (
            (!allowedRole || employee.jobPosition === allowedRole) &&
            (!onlyAdmins || getEmployeeIsAdmin(employee))
        ) {
          setStatus('authorized');
        } else {
          setStatus('unauthorized');
        }
      } catch (error) {
        setStatus('unauthorized');
      }
    };
    checkRole();
  }, [allowedRole]);

  if (status === 'loading') return <div className="p-8">Verifying permissions...</div>;

  if (status === 'unauthorized') {
    return <Blocked/>;
  }

  return <Outlet context={mainContext}/>;
};