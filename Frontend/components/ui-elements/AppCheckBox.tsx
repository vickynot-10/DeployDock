"use client";

import { memo } from "react";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
    disabled?: boolean;
}

function AppCheckbox({
  checked,
  indeterminate,
  onChange,
  className = "",
  disabled = false
}: CheckboxProps) {
  return (
    <button 
    type="button"
      onClick={(e) => {
        e.stopPropagation();
        if(disabled){
            return
        }
        onChange();
      }}
      className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors
        ${
          checked || indeterminate
            ? "bg-[var(--text-1)] border-[var(--text-1)]"
            : "bg-transparent border-[var(--border-3)] hover:border-[var(--text-3)]"
        } ${className}`}
    >
      {indeterminate && !checked ? (
        <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
          <rect width="10" height="2" rx="1" fill="#08090a" />
        </svg>
      ) : checked ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#08090a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

export default memo(AppCheckbox);
