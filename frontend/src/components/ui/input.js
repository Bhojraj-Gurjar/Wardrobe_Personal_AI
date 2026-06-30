import { cn } from '@/utils/cn';
import { formInputClass } from '@/components/ui/form-control-styles';

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        formInputClass,
        'caret-dashboard-foreground',
        className,
      )}
      {...props}
    />
  );
}
