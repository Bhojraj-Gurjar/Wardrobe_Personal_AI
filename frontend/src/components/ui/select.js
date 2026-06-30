import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formSelectClass } from '@/components/ui/form-control-styles';

export function SelectField({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(formSelectClass, className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted transition-colors duration-300"
        aria-hidden="true"
      />
    </div>
  );
}
