'use client';



import { memo, useCallback, useMemo } from 'react';

import { cn } from '@/utils/cn';



export const SelectionChip = memo(function SelectionChip({

  label,

  selected,

  onClick,

  multiple = false,

  className,

}) {

  return (

    <button

      type="button"

      role={multiple ? 'checkbox' : 'radio'}

      aria-checked={selected}

      onClick={onClick}

      className={cn(

        'rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all',

        selected

          ? 'border-primary bg-dashboard-accent-soft text-primary shadow-[0_0_0_1px_var(--primary)]'

          : 'border-dashboard-border bg-dashboard-surface-elevated text-dashboard-foreground hover:border-primary/40',

        className,

      )}

    >

      {label}

    </button>

  );

});



export const SelectionChipGroup = memo(function SelectionChipGroup({

  options,

  value,

  onChange,

  multiple = false,

  columns = 2,

}) {

  const selected = multiple ? value || [] : value;



  const isSelected = useCallback(

    (optionValue) => {

      if (multiple) return selected.includes(optionValue);

      return selected === optionValue;

    },

    [multiple, selected],

  );



  const toggle = useCallback(

    (optionValue) => {

      if (multiple) {

        const current = selected || [];

        onChange(

          current.includes(optionValue)

            ? current.filter((item) => item !== optionValue)

            : [...current, optionValue],

        );

        return;

      }

      onChange(optionValue);

    },

    [multiple, onChange, selected],

  );



  const gridClassName = useMemo(

    () =>

      cn(

        'grid gap-3',

        columns === 2 && 'sm:grid-cols-2',

        columns === 3 && 'sm:grid-cols-3',

        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',

      ),

    [columns],

  );



  return (

    <div

      className={gridClassName}

      role={multiple ? 'group' : 'radiogroup'}

    >

      {options.map((option) => {

        const optionValue = option.value ?? option;

        const optionLabel = option.label ?? option;



        return (

          <SelectionChip

            key={optionValue}

            label={optionLabel}

            selected={isSelected(optionValue)}

            multiple={multiple}

            onClick={() => toggle(optionValue)}

          />

        );

      })}

    </div>

  );

});

