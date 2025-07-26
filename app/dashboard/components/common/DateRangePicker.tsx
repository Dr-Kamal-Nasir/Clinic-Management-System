// src/components/common/DateRangePicker.tsx
'use client';
import { format } from 'date-fns';
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

interface DateRangePickerProps {
  value: { start: Date; end: Date }; // Remove undefined
  onChange: (range: { start: Date; end: Date }) => void; // Remove undefined
  className?: string;
  align?: 'start' | 'center' | 'end';
  placeholder?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  className,
  align = 'end',
  placeholder = 'Select date range'
}: DateRangePickerProps) {
  // Convert to react-day-picker's DateRange format
  const dateRangeValue = { from: value.start, to: value.end };

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      // Instead of undefined, reset to default range
      onChange({
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
      });
      return;
    }
    
    // Always pass a valid date range
    onChange({ 
      start: range.from, 
      end: range.to || range.from 
    });
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.start ? (
              value.end ? (
                <>
                  {format(value.start, 'MMM dd, yyyy')} -{' '}
                  {format(value.end, 'MMM dd, yyyy')}
                </>
              ) : (
                format(value.start, 'MMM dd, yyyy')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value.start}
            selected={dateRangeValue}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
