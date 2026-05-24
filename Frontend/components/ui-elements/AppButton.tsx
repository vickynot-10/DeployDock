import { forwardRef, memo } from "react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses = {
  primary: "bg-[var(--text-1)] text-[var(--bg-0)] hover:bg-[var(--text-2)] border border-transparent",
  secondary: "bg-[var(--bg-3)] text-[var(--text-1)] hover:bg-[var(--bg-4)] border border-[var(--border-2)]",
  outline: "bg-transparent text-[var(--text-1)] border border-[var(--border-2)] hover:border-[var(--border-3)] hover:bg-[var(--bg-2)]",
  ghost: "bg-transparent text-[var(--text-3)] border border-transparent hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]",
  danger: "bg-[#2a1215] text-red-400 border border-[#7f1d1d] hover:bg-[#3a1a1d]",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

const AppButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-medium rounded-lg",
          "transition-colors duration-150 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "w-fit",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin shrink-0"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
              <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

AppButton.displayName = "AppButton";

export default memo(AppButton);