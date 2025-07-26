//components/SessionRefresher.tsx

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SessionRefresher() {
  const { update } = useSession();

  useEffect(() => {
    const interval = setInterval(() => update(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  },[update]);
    return null;
  }
