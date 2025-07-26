// components/pharmacy/MedicineStockForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Define the schema with proper types
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.date().refine(val => val instanceof Date, {
    message: 'Expiry date is required',
  }),
  originalQuantity: z.number().min(0, 'Quantity must be at least 0'),
  currentQuantity: z.number().min(0).optional(),
  additionalQuantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0, 'Unit price must be at least 0'),
  sellingPrice: z.number().min(0, 'Selling price must be at least 0'),
  newUnitPrice: z.number().min(0).optional(),
  newSellingPrice: z.number().min(0).optional(),
  supplier: z.string().min(2, 'Supplier must be at least 2 characters'),
  description: z.string().optional(),
});

// Define the medicine data type
interface Medicine {
  _id: string;
  name: string;
  batchNumber: string;
  expiryDate: Date;
  originalQuantity: number;
  currentQuantity: number;
  unitPrice: number;
  sellingPrice: number;
  supplier: string;
  description?: string;
}

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define the component props
interface MedicineStockFormProps {
  initialData?: Medicine;
  onSuccess: () => void;
}

export default function MedicineStockForm({ 
  initialData,
  onSuccess 
}: MedicineStockFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      batchNumber: '',
      expiryDate: new Date(),
      originalQuantity: 0,
      unitPrice: 0,
      sellingPrice: 0,
      supplier: '',
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const url = initialData 
        ? `/api/pharmacy/stock/${initialData._id}` 
        : '/api/pharmacy/stock';
      
      const method = initialData ? 'PUT' : 'POST';
      
      // Prepare data for API with proper typing
      const payload: Partial<FormValues> = { ...values };
      
      // For new items, set currentQuantity = originalQuantity
      if (!isEditMode) {
        payload.currentQuantity = values.originalQuantity;
      }
      
      // Remove optional fields for new items
      if (!isEditMode) {
        delete payload.additionalQuantity;
        delete payload.newUnitPrice;
        delete payload.newSellingPrice;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        toast('Success', {
          description: initialData 
            ? 'Medicine updated successfully' 
            : 'Medicine added successfully',
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to save medicine');
      }
    } catch (error: unknown) {
      toast('Error', {
        description: error instanceof Error 
          ? error.message 
          : 'Could not save medicine',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicine Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter medicine name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batchNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Number *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter batch number" 
                    {...field} 
                    disabled={isEditMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditMode ? (
            <>
              <FormItem>
                <FormLabel>Original Quantity</FormLabel>
                <div className="flex items-center gap-2">
                  <Input 
                    value={initialData.originalQuantity}
                    readOnly
                  />
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {Math.round((initialData.currentQuantity / initialData.originalQuantity) * 100)}% remaining
                  </Badge>
                </div>
              </FormItem>
              
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Adjust current stock" 
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={0}
                        max={initialData.originalQuantity}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="additionalQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add New Stock</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Quantity to add" 
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>New Stock Prices</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="newUnitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Unit price" 
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newSellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Selling price" 
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Prices for new stock only
                </p>
              </div>
            </>
          ) : (
            <FormField
              control={form.control}
              name="originalQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter quantity" 
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!isEditMode && (
            <>
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (AFN) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter unit price" 
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (AFN) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter selling price" 
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter supplier name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional details about the medicine" 
                    {...field} 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              onSuccess();
              setLoading(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading 
              ? 'Saving...' 
              : initialData ? 'Update Medicine' : 'Save Medicine'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
