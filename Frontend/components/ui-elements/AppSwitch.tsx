"use client";

import { InputHTMLAttributes, memo, useId } from "react";

interface AppSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

 function AppSwitch({
  label,
  description,
  size = "md",
  className = "",
  disabled,
  ...props
}: AppSwitchProps) {
  const id = useId();

  const track_size = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  }[size];

  const thumb_size = {
    sm: "w-3 h-3 peer-checked:translate-x-4",
    md: "w-4 h-4 peer-checked:translate-x-5",
    lg: "w-5 h-5 peer-checked:translate-x-7",
  }[size];

  const thumb_pos = {
    sm: "top-0.5 left-0.5",
    md: "top-1 left-1",
    lg: "top-1 left-1",
  }[size];

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-3 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <div className="relative flex-shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          {...props}
        />
        <div
          className={`${track_size} rounded-full border transition-all duration-200
            bg-[var(--bg-4)] border-[var(--border-2)]
            peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]
            peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-1)]
            ${!disabled ? "peer-hover:border-[var(--border-3)]" : ""}`}
        />
        <div
          className={`absolute ${thumb_pos} ${thumb_size} rounded-full bg-[var(--text-3)]
            transition-all duration-200
            peer-checked:bg-white peer-checked:shadow-sm`}
        />
      </div>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className={`font-medium leading-none text-[var(--text-1)] ${size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"}`}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--text-3)] leading-snug">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
export default memo(AppSwitch)