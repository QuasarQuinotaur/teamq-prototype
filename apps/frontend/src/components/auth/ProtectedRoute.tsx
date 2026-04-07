import { useUserLink } from '@/hooks/useUserLink';
import { Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const { isLoading } = useUserLink();

  if (isLoading) {
    // Show a blank screen or a spinner instead of the page content
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanover-blue"></div>
      </div>
    );
  }

  // Only render the actual page content once loading is finished
  return <Outlet />;
}