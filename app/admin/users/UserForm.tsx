// src/app/admin/users/UserForm.tsx
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserRoleEnum } from '@/lib/schemas/userSchema';
import { z } from 'zod';

// Define a unified form schema that works for both create and update
const UserFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+]+$/, 'Invalid phone number format'),
  role: z.enum(UserRoleEnum),
  approved: z.boolean(),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof UserFormSchema>;

interface UserFormProps {
  user?: (Partial<UserFormValues> & { _id?: string }) | null;
  onSuccess: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!user?._id;
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      role: user?.role || 'laboratory',
      approved: user?.approved || false,
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate password for new users
      if (!isEditMode && !data.password) {
        toast.error('Password is required for new users');
        setIsSubmitting(false);
        return;
      }

      // Validate password strength for new users or when password is provided
      if (data.password && (!isEditMode || data.password.length > 0)) {
        if (data.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          setIsSubmitting(false);
          return;
        }
        if (!/[A-Z]/.test(data.password)) {
          toast.error('Password must contain at least one uppercase letter');
          setIsSubmitting(false);
          return;
        }
        if (!/[0-9]/.test(data.password)) {
          toast.error('Password must contain at least one number');
          setIsSubmitting(false);
          return;
        }
        if (!/[!@#$%^&*]/.test(data.password)) {
          toast.error('Password must contain at least one special character');
          setIsSubmitting(false);
          return;
        }
      }

      const url = user?._id 
        ? `/api/admin/users/${user._id}`
        : '/api/admin/users';
      
      const method = user?._id ? 'PUT' : 'POST';
      
      // Prepare payload - remove password field entirely if empty for updates
      const payload: any = { ...data };
      if (user?._id && !data.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string; message?: string; details?: any };
        // Handle validation errors with details
        if (errorData.details) {
          const validationErrors = Object.values(errorData.details.fieldErrors || {}).flat();
          throw new Error(validationErrors.join(', ') || 'Validation failed');
        }
        throw new Error(errorData.error || errorData.message || 'Failed to save user');
      }
      
      toast.success(user?._id ? 'User updated' : 'User created');
      onSuccess();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && <span className="text-sm text-gray-500">(leave empty to keep current)</span>}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UserRoleEnum.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="approved"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Approve User</FormLabel>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save User'}
        </Button>
      </form>
    </Form>
  );
}
