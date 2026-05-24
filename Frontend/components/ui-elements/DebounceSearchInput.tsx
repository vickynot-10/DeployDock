import React, { forwardRef, memo, useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { PiMagnifyingGlass, PiXCircle } from "react-icons/pi";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  label?: string;
  hint?: string;
  debounce?: number;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  wrapperClassName?: string;
  className?: string;
  
}

const AppSearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      label,
      hint,
      debounce = 1000,
      onChange,
      fullWidth = true,
      wrapperClassName = "",
      className = "",
      id,
      defaultValue = "",
      ...rest
    },
    ref,
  ) => {
    const [internal_value, set_internal_value] = useState(String(defaultValue));
    const timer_ref = useRef<ReturnType<typeof setTimeout> | null>(null);
    const input_id = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    useEffect(() => {
      return () => {
        if (timer_ref.current) clearTimeout(timer_ref.current);
      };
    }, []);

    const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      set_internal_value(val);
      if (timer_ref.current) clearTimeout(timer_ref.current);
      timer_ref.current = setTimeout(() => {
        onChange?.(val);
      }, debounce);
    };

    const handle_clear = () => {
      set_internal_value("");
      if (timer_ref.current) clearTimeout(timer_ref.current);
      onChange?.("");
    };

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : "w-fit"} ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={input_id}
            className="text-[13px] font-medium text-[var(--text-2)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center group">
          <span className="absolute left-3.5 flex items-center text-[var(--text-4)] transition-colors duration-200 group-focus-within:text-[var(--text-2)]">
            <PiMagnifyingGlass size={16} />
          </span>

          <input
            id={input_id}
            ref={ref}
            type="search"
            value={internal_value}
            onChange={handle_change}
            className={[
              "w-full pl-10 pr-10 py-2.5 text-sm text-[var(--text-1)]",
              "bg-[var(--bg-2)] rounded-lg border border-[var(--border-1)]",
              "placeholder:text-[var(--text-4)]",
              "outline-none transition-all duration-200",
              "focus:border-[var(--border-3)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "[&::-webkit-search-cancel-button]:hidden",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {internal_value && (
            <button
              type="button"
              onClick={handle_clear}
              className="absolute right-3.5 flex items-center text-[var(--text-4)] transition-colors duration-200 hover:text-[var(--text-2)]"
            >
              <PiXCircle size={16} />
            </button>
          )}
        </div>

        {hint && (
          <p className="text-xs text-[var(--text-4)] ml-0.5">{hint}</p>
        )}
      </div>
    );
  },
);

export default memo(AppSearchInput);