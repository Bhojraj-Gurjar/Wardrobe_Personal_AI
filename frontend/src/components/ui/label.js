import { cn } from '@/utils/cn';
import { formLabelClass } from '@/components/ui/form-control-styles';

export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        formLabelClass,
        'leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
