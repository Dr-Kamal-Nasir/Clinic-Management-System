import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from './label';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
}

export const FormInput = <T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder
}: FormInputProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <div className="grid gap-1">
        <Label htmlFor={name}>{label}</Label>
        <Input 
          id={name} 
          type={type} 
          placeholder={placeholder}
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
