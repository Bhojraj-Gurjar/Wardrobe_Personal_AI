'use client';

import { CMS_CATEGORIES } from '../constants/cms-taxonomy';
import {
  wizardLabelClass,
  wizardSelectClass,
} from './wizard-form-styles';
import { WizardFieldLabel } from './wizard-field-label';

type CategorySelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

export function CategorySelector({
  value,
  onChange,
  disabled,
  error,
  required,
}: CategorySelectorProps) {
  return (
    <div>
      <WizardFieldLabel required={required}>Category</WizardFieldLabel>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={wizardSelectClass}
      >
        <option value="" className="bg-[#0d1224] text-white/60">
          Select category
        </option>
        {CMS_CATEGORIES.map((category) => (
          <option key={category} value={category} className="bg-[#0d1224] text-white">{category}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
