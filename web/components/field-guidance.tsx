'use client';

import {
  tipForField,
  type FieldGuidanceKey,
} from '@/lib/field-guidance';
import { type FC, type ReactNode, useState } from 'react';

export {
  tipForField,
  FIELD_GUIDANCE_TIPS,
  type FieldGuidanceKey,
} from '@/lib/field-guidance';

export const FieldGuidance: FC<{
  fieldKey: FieldGuidanceKey;
  children: ReactNode;
  className?: string;
}> = ({ fieldKey, children, className }) => {
  const [focused, setFocused] = useState(false);
  const tip = tipForField(fieldKey);

  return (
    <div
      className={className}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      {children}
      {focused ? (
        <p className="mt-1 text-xs text-sky-800" role="note">
          {tip}
        </p>
      ) : null}
    </div>
  );
};
