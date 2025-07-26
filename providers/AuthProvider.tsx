'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const initialize = useAuthStore(state => state.initialize);
  const refreshAccessToken = useAuthStore(state => state.refreshAccessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Set up token refresh interval
    const interval = setInterval(() => {
      refreshAccessToken().catch(error => {
        console.error('Automatic token refresh failed:', error);
      });
    }, 14 * 60 * 1000); // Refresh every 14 minutes
    
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshAccessToken]);
  
  return <>{children}</>;
}