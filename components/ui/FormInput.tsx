import { Control, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from './label';

interface FormInputProps {
  control: Control<any>;
  name: string;
  label: string;
  type?: string;
  placeholder?: string,
}

export const FormInput = ({ control, name, label, type = 'text', placeholder }: FormInputProps) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <div className="grid gap-1">
        <Label htmlFor={name}>{label}</Label>
        <Input 
          id={name} 
          type={type} 
          {...field} 
          value={field.value ?? ''}
        />
        {fieldState.error && (
          <p className="text-sm text-red-500">{fieldState.error.message}</p>
        )}
      </div>
    )}
  />
);
