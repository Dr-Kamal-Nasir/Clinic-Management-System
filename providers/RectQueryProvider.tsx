"use client"

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import { ReactNode, useState} from 'react';

export default function ReactQueryProvider ({children}: {children: ReactNode}){
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute,
                retry: 1,
            }
        }
    }));
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
};