'use client';

import { CMS_CATEGORIES } from '../constants/cms-taxonomy';
import {
  wizardLabelClass,
  wizardSelectClass,
} from './wizard-form-styles';

type CategorySelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function CategorySelector({ value, onChange, disabled, error }: CategorySelectorProps) {
  return (
    <div>
      <label className={wizardLabelClass}>Category</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={wizardSelectClass}
      >
        {CMS_CATEGORIES.map((category) => (
          <option key={category} value={category} className="bg-[#0d1224] text-white">{category}</option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
