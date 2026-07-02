'use client';

import { useMemo } from 'react';
import { getProductTypesForCategory } from '../constants/cms-taxonomy';
import {
  wizardSelectClass,
} from './wizard-form-styles';
import { WizardFieldLabel } from './wizard-field-label';

type ProductTypeSelectorProps = {
  category: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

export function ProductTypeSelector({
  category,
  value,
  onChange,
  disabled,
  error,
  required,
}: ProductTypeSelectorProps) {
  const options = useMemo(() => {
    const types = getProductTypesForCategory(category);

    if (value && !types.includes(value)) {
      return [value, ...types];
    }

    return types;
  }, [category, value]);

  return (
    <div>
      <WizardFieldLabel required={required}>Product Type</WizardFieldLabel>
      <select
        value={value}
        disabled={disabled || !category || !options.length}
        onChange={(event) => onChange(event.target.value)}
        className={wizardSelectClass}
      >
        <option value="" className="bg-[#0d1224] text-white/60">
          Select product type
        </option>
        {options.map((type) => (
          <option key={type} value={type} className="bg-[#0d1224] text-white">{type}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
