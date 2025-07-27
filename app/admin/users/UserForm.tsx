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
import { z } from 'zod';

// Define the form schema internally
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+]+$/, 'Invalid phone number format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Must contain at least one special character')
    .optional(),
  role: z.enum(['admin', 'ceo', 'laboratory', 'pharmacy']),
  approved: z.boolean()
});

// Infer the form type from the schema
type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user?: Partial<UserFormValues> & { _id?: string } | null;
  onSuccess: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: user || {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'laboratory',
      approved: false,
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const url = user?._id 
        ? `/api/admin/users/${user._id}`
        : '/api/admin/users';
      
      const method = user?._id ? 'PUT' : 'POST';
      
      // Remove password if empty for updates
      const payload = user?._id && !data.password 
        ? { ...data, password: undefined }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Failed to save user');
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
        
        {!user?._id && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
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
                  {formSchema.shape.role.options.map(role => (
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
