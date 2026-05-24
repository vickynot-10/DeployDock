"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import type { SingleValue, Props as SelectProps } from "react-select";

const Select = dynamic(() => import("react-select")) as React.ComponentType<
  SelectProps<any, false>
>;

export interface Option<T = any> {
  value: T;
  label: string;
}

interface AppSelectProps<T = any> {
  value: Option<T> | null;
  onChange: (option: Option<T> | null) => void;
  options: Option<T>[];
  isSearchable?: boolean;
  className?: string;
   placeholder?: string; 
  classNamePrefix?: string;
}

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "var(--bg-2)",
    borderColor: state.isFocused ? "var(--accent)" : "var(--border-2)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--accent)" : "none",
    "&:hover": { borderColor: "var(--border-3)" },
    fontSize: "0.75rem",
    minHeight: "32px",
    height :'100%',
    cursor: "pointer",
  }),
      input: (base: any) => ({ ...base, color: "var(--text-2)" }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--bg-2)",
    border: "1px solid var(--border-2)",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--bg-3)" : "var(--bg-2)",
    color: "var(--text-2)",
    cursor: "pointer",
    "&:active": { backgroundColor: "var(--bg-4)" },
  }),
  singleValue: (base: any) => ({ ...base, color: "var(--text-2)" }),
  indicatorSeparator: (base: any) => ({ ...base, display: "none" }),
  dropdownIndicator: (base: any) => ({
    ...base,
    color: "var(--text-3)",
    "&:hover": { color: "var(--text-2)" },
  }),
};

function AppSelect<T = any>({
  value,
  onChange,
  options,
  isSearchable = false,
  className,
  classNamePrefix = "react-select",
  placeholder = "Select"
}: AppSelectProps<T>) {
  const handleChange = (newValue: SingleValue<Option<T>>) => {
    onChange(newValue ?? null);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={options}
      styles={customSelectStyles}
      isSearchable={isSearchable}
      className={className}
      classNamePrefix={classNamePrefix}
      placeholder={placeholder}
    />
  );
}
export default memo(AppSelect) as typeof AppSelect;