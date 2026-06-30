'use client';



import { memo } from 'react';

import { cn } from '@/utils/cn';



export const GenderCard = memo(function GenderCard({ label, selected, onClick }) {

  return (

    <button

      type="button"

      role="radio"

      aria-checked={selected}

      onClick={onClick}

      className={cn(

        'rounded-2xl border px-4 py-4 text-center text-sm font-semibold transition-all',

        selected

          ? 'border-primary bg-dashboard-accent-soft text-primary'

          : 'border-dashboard-border bg-dashboard-surface-elevated text-dashboard-foreground hover:border-primary/40',

      )}

    >

      {label}

    </button>

  );

});



export const GenderCardGroup = memo(function GenderCardGroup({

  options,

  value,

  onChange,

}) {

  return (

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup">

      {options.map((option) => (

        <GenderCard

          key={option.value}

          label={option.label}

          selected={value === option.value}

          onClick={() => onChange(option.value)}

        />

      ))}

    </div>

  );

});

