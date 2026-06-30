'use client';

import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select';
import { formCheckboxClass, formLabelClass } from '@/components/ui/form-control-styles';
import { ADDRESS_TYPES } from '@/features/checkout/constants/checkout.constants';
import { cn } from '@/utils/cn';

const fieldClass = 'space-y-2';

export function AddressForm({ value, onChange, errors = {} }) {
  const update = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className={cn(fieldClass, 'sm:col-span-2')}>
        <label className={formLabelClass}>Full Name</label>
        <Input
          value={value.full_name || ''}
          onChange={(e) => update('full_name', e.target.value)}
          aria-invalid={Boolean(errors.full_name)}
        />
        {errors.full_name ? <p className="text-xs text-red-400">{errors.full_name}</p> : null}
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Phone</label>
        <Input
          value={value.phone || ''}
          onChange={(e) => update('phone', e.target.value)}
          aria-invalid={Boolean(errors.phone)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Alternate Phone</label>
        <Input
          value={value.alternate_phone || ''}
          onChange={(e) => update('alternate_phone', e.target.value)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Country</label>
        <Input
          value={value.country || 'India'}
          onChange={(e) => update('country', e.target.value)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>State</label>
        <Input
          value={value.state || ''}
          onChange={(e) => update('state', e.target.value)}
          aria-invalid={Boolean(errors.state)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>City</label>
        <Input
          value={value.city || ''}
          onChange={(e) => update('city', e.target.value)}
          aria-invalid={Boolean(errors.city)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Pincode</label>
        <Input
          value={value.pincode || ''}
          onChange={(e) => update('pincode', e.target.value)}
          maxLength={6}
          aria-invalid={Boolean(errors.pincode)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>House / Flat No.</label>
        <Input
          value={value.house_no || ''}
          onChange={(e) => update('house_no', e.target.value)}
          aria-invalid={Boolean(errors.house_no)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Landmark</label>
        <Input
          value={value.landmark || ''}
          onChange={(e) => update('landmark', e.target.value)}
        />
      </div>
      <div className={fieldClass}>
        <label className={formLabelClass}>Address Type</label>
        <Select
          value={value.address_type || 'HOME'}
          onChange={(e) => update('address_type', e.target.value)}
        >
          {ADDRESS_TYPES.map((type) => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </Select>
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-dashboard-surface/60 px-4 py-3.5 text-sm text-dashboard-muted transition-colors hover:border-white/[0.1] sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(value.is_default)}
          onChange={(e) => update('is_default', e.target.checked)}
          className={formCheckboxClass}
        />
        Save as default address
      </label>
    </div>
  );
}
