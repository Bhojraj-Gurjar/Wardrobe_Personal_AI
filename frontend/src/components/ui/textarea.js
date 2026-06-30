import { cn } from '@/utils/cn';
import { formTextareaClass } from '@/components/ui/form-control-styles';

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(formTextareaClass, className)}
      {...props}
    />
  );
}
