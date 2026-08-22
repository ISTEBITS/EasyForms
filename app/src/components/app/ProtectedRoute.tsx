import { useAuth } from '@/context/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader className="h-5 w-5 animate-spin text-accent-5" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
