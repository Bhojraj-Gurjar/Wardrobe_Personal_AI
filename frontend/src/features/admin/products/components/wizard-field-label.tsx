'use client';

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { wizardLabelClass } from './wizard-form-styles';

type WizardFieldLabelProps = {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function WizardFieldLabel({
  htmlFor,
  required,
  children,
  className,
}: WizardFieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn(wizardLabelClass, className)}>
      {children}
      {required ? (
        <span className="ml-0.5 text-purple-300" aria-hidden="true">*</span>
      ) : null}
    </label>
  );
}
