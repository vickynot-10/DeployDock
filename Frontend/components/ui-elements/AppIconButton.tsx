"use client";

import { memo, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: any;
  className?: string;
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--text-1)] text-[var(--bg-0)] border border-transparent " +
    "hover:bg-[var(--text-2)] shadow-sm hover:shadow-md",

  secondary:
    "bg-[var(--bg-3)] text-[var(--text-1)] border border-[var(--border-2)] " +
    "hover:bg-[var(--bg-4)] hover:border-[var(--border-3)]",

  outline:
    "bg-transparent text-[var(--text-2)] border border-[var(--border-2)] " +
    "hover:bg-[var(--bg-2)] hover:text-[var(--text-1)] hover:border-[var(--border-3)]",

  ghost:
    "bg-transparent text-[var(--text-3)] border border-transparent " +
    "hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]",

  danger:
    "bg-red-500/10 text-red-400 border border-red-500/20 " +
    "hover:bg-red-500/20 hover:text-red-300 " +
    "hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "w-7 h-7 rounded-md",
  md: "w-8 h-8 rounded-lg",
  lg: "w-20 h-20 rounded-lg",
};

function AppIconButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "flex items-center justify-center shrink-0",
        "transition-colors duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export default memo(AppIconButton);
