// utils/dateUtils.ts
import { format } from 'date-fns';

export const safeFormat = (date: Date | string | undefined, formatStr: string, fallback = 'N/A') => {
  try {
    if (!date) return fallback;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isNaN(dateObj.getTime()) ? fallback : format(dateObj, formatStr);
  } catch {
    return fallback;
  }
};