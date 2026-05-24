import React, { forwardRef, memo } from "react";
import type { InputHTMLAttributes } from "react";
import { MdErrorOutline } from "react-icons/md";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  wrapperClassName?: string;
  className?: string;
}

const AppTextInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      wrapperClassName = "",
      className = "",
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

   
    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : "w-fit"} ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[var(--text-2)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <span className="absolute left-3.5 flex items-center text-[var(--text-4)] transition-colors duration-200 group-focus-within:text-[var(--text-2)]">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            className={[
              "w-full px-4 py-2.5 text-sm text-[var(--text-1)]",
              "bg-[var(--bg-2)] rounded-lg border",
              "placeholder:text-[var(--text-4)]",
              "outline-none transition-all duration-200",
              error
                ? "border-red-500/60 focus:border-red-500"
                : "border-[var(--border-1)] focus:border-[var(--border-3)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "",
              rightIcon || error ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {error ? (
            <span className="absolute right-3.5 flex items-center text-red-400">
              <MdErrorOutline size={16} />
            </span>
          ) : rightIcon ? (
            <span className="absolute right-3.5 flex items-center pointer-events-none text-[var(--text-4)] transition-colors duration-200 group-focus-within:text-[var(--text-2)]">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-red-400 flex items-center gap-1 ml-0.5">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[var(--text-4)] ml-0.5">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export default memo(AppTextInput);