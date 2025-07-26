'use client';

import { AdminSidebar } from '@/components/admin/Sidebar';
import ClinicLoadingAnimation from '@/components/ClinicLoadingAnimation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !initialized) {
      // Only check when not loading
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        router.push('/unauthorized');
      }
      setInitialized(true);
    }
  }, [isAuthenticated, user, router, isLoading, initialized]);

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ClinicLoadingAnimation/>
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting...</p>
    </div>
  );
}