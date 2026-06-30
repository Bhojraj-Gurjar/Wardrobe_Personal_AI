'use client';

import { useMemo } from 'react';
import { getProductTypesForCategory } from '../constants/cms-taxonomy';
import {
  wizardLabelClass,
  wizardSelectClass,
} from './wizard-form-styles';

type ProductTypeSelectorProps = {
  category: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function ProductTypeSelector({
  category,
  value,
  onChange,
  disabled,
  error,
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
      <label className={wizardLabelClass}>Product Type</label>
      <select
        value={value}
        disabled={disabled || !options.length}
        onChange={(event) => onChange(event.target.value)}
        className={wizardSelectClass}
      >
        {!value ? (
          <option value="" className="bg-[#0d1224] text-white/60">
            Select product type
          </option>
        ) : null}
        {options.map((type) => (
          <option key={type} value={type} className="bg-[#0d1224] text-white">{type}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
