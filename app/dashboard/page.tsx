'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import AdminCeoDashboard from './components/admin/AdminCeoDashborad';
import { Skeleton } from '@/components/ui/skeleton';
// import LaboratoryDashboard from './components/laboratory/LaboratoryDashboard';
// import PharmacyDashboard from '@/app/pharmacy/page';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (!isAuthenticated) {
        router.push('/login');
      }
      setInitialized(true);
    }
  }, [isAuthenticated, isLoading, router, initialized]);

  if (isLoading || !initialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Welcome back, {user?.name} ({user?.role})
      </p>
      
      
      <div className="mt-8">
        {user?.role === 'admin' && <AdminDashboard />}
        {user?.role === 'laboratory' && <LaboratoryDashboard />}
        {user?.role === 'pharmacy' && <PharmacyDashboard />}
        {user?.role === 'ceo' && <CEODashboard />}
      </div>
    </div>
  );
}

const AdminDashboard = () => <div><AdminCeoDashboard/></div>;
const LaboratoryDashboard = () => <div>Laboratory Dashboard</div>;
const PharmacyDashboard = () => <div>Pharmacy Dashboard</div>;
const CEODashboard = () => <div>CEO Dashboard</div>;