//app/unauthorized/page.tsx
'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClinicLoadingAnimation from '@/components/ClinicLoadingAnimation';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role === 'laboratory') {
      router.push('/laboratory/records');
    } else if (user?.role === 'pharmacy') {
      router.push('/pharmacy');
    } else if (user?.role === 'admin' || user?.role === 'ceo') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <ClinicLoadingAnimation/>
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
            403 - Unauthorized Access
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            You don&apos;t have permission to access this page. Please contact your administrator.
          </p>
          <div className="flex justify-center space-x-11">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
            <Button className=''>
              <Link href='/login'>Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
