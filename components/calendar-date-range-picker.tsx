// components/calendar-date-range-picker.tsx
'use client';

import * as React from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface CalendarDateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function CalendarDateRangePicker({
  dateRange,
  onDateChange,
  className,
}: CalendarDateRangePickerProps) {
  const [preset, setPreset] = React.useState<string>('custom');

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();
    
    switch (value) {
      case 'today':
        onDateChange({ from: today, to: today });
        break;
      case 'yesterday': {
        const yesterday = addDays(today, -1);
        onDateChange({ from: yesterday, to: yesterday });
        break;
      }
      case 'last7':
        onDateChange({ from: addDays(today, -7), to: today });
        break;
      case 'last30':
        onDateChange({ from: addDays(today, -30), to: today });
        break;
      case 'thisMonth':
        onDateChange({ 
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: today
        });
        break;
      case 'lastMonth': {
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        onDateChange({
          from: firstDayLastMonth,
          to: lastDayLastMonth
        });
        break;
      }
      case 'custom':
      default:
        // Keep current selection
        break;
    }
  };

  React.useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      setPreset('custom');
      return;
    }

    const today = new Date();
    const yesterday = addDays(today, -1);

    if (isSameDay(dateRange.from, today)) {
      setPreset('today');
    } else if (isSameDay(dateRange.from, yesterday)) {
      setPreset('yesterday');
    } else if (
      isSameDay(dateRange.from, addDays(today, -7)) &&
      isSameDay(dateRange.to, today)
    ) {
      setPreset('last7');
    } else if (
      isSameDay(dateRange.from, addDays(today, -30)) &&
      isSameDay(dateRange.to, today)
    ) {
      setPreset('last30');
    } else if (
      dateRange.from.getDate() === 1 &&
      dateRange.from.getMonth() === today.getMonth() &&
      dateRange.from.getFullYear() === today.getFullYear() &&
      isSameDay(dateRange.to, today)
    ) {
      setPreset('thisMonth');
    } else if (
      dateRange.from.getDate() === 1 &&
      dateRange.from.getMonth() === today.getMonth() - 1 &&
      dateRange.to.getDate() === new Date(today.getFullYear(), today.getMonth(), 0).getDate() &&
      dateRange.to.getMonth() === today.getMonth() - 1
    ) {
      setPreset('lastMonth');
    } else {
      setPreset('custom');
    }
  }, [dateRange]);

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="thisMonth">This month</SelectItem>
            <SelectItem value="lastMonth">Last month</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                'w-[260px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM dd, y')} -{' '}
                    {format(dateRange.to, 'MMM dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                onDateChange(range);
                if (range?.from && range?.to) {
                  setPreset('custom');
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}