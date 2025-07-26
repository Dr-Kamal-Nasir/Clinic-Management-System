// lib/hooks/useLaboratoryRecords.ts
import useSWR from 'swr';
import { LaboratoryRecordResponse } from '@/lib/types/laboratory';

export function useLaboratoryRecords(dateRange?: { from: Date; to: Date }) {
  const params = new URLSearchParams();
  if (dateRange?.from) params.set('fromDate', dateRange.from.toISOString());
  if (dateRange?.to) params.set('toDate', dateRange.to.toISOString());

  const { data, error, mutate } = useSWR<LaboratoryRecordResponse[]>(
    `/api/laboratory/records?${params.toString()}`,
    async (url: string) => { // Explicitly type the url parameter
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json() as Promise<LaboratoryRecordResponse[]>;
    }
  );

  return {
    records: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
