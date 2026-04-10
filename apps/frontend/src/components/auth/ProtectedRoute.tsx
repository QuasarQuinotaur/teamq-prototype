import { useUserLink } from '@/hooks/useUserLink';
import { Outlet } from 'react-router-dom';
import NotRegistered from '@/pages/NotRegistered';

export function ProtectedRoute() {
  const { isLoading, notRegistered } = useUserLink();

  if (isLoading) {
    // Show a blank screen or a spinner instead of the paging content
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanover-blue"></div>
      </div>
    );
  }

  if (notRegistered) {
    return <NotRegistered />;
  }

  // Only render the actual paging content once loading is finished
  return <Outlet />;
}