'use client';

import { Check, Camera, Sun, Glasses } from 'lucide-react';
import { FACE_REGISTER_INSTRUCTIONS } from '@/features/face/constants/face-steps';
import { faceAuthPrimaryButtonClass } from '@/features/face/components/face-auth-layout';
import { cn } from '@/utils/cn';

const INSTRUCTION_ICONS = [Camera, Sun, Glasses];

export function FaceRegisterInstructions({ onStart }) {
  return (
    <>
      <ul className="mb-8 w-full space-y-3">
        {FACE_REGISTER_INSTRUCTIONS.map((text, index) => {
          const Icon = INSTRUCTION_ICONS[index] || Check;

          return (
            <li
              key={text}
              className={cn(
                'flex items-center gap-4 rounded-2xl border border-[#9333EA]/20',
                'bg-[#1A2235]/80 p-4',
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#9333EA]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Check className="size-4 shrink-0 text-[#9333EA]" aria-hidden="true" />
                {text}
              </span>
            </li>
          );
        })}
      </ul>

      <button type="button" onClick={onStart} className={faceAuthPrimaryButtonClass}>
        <Camera className="size-5" aria-hidden="true" />
        Start Face Scan
      </button>
    </>
  );
}
