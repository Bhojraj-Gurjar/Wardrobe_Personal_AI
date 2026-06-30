import { cn } from '@/utils/cn';
import {
  formControlBaseClass,
  formInputClass,
  formLabelClass,
  formSelectClass,
  formTextareaClass,
} from '@/components/ui/form-control-styles';

export const wizardLabelClass = formLabelClass;

export const wizardFieldBaseClass = formControlBaseClass;

export const wizardInputClass = formInputClass;

export const wizardSelectClass = formSelectClass;

export const wizardTextareaClass = cn(formTextareaClass, 'mt-1.5');

export const wizardReadOnlyInputClass = cn(wizardInputClass, 'cursor-default opacity-75');
