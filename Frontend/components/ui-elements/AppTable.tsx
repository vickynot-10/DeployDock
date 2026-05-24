"use client";
import Skeleton from "react-loading-skeleton";
import { memo } from "react";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import Image from "next/image";
import AppSelect, { Option } from "./AppSelect";

type ColumnDef<T> = {
  key: keyof T;
  label: string;
  render?: (val: T[keyof T], row: T) => React.ReactNode;
  headerClassName?: string;
};

type TableProps<T> = {
  title?: string;
  isLoading?: boolean;
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  actions?: (row: T) => React.ReactNode;
};

const pageSizeOptions: Option<number>[] = [
  { value: 10, label: "10 Per page" },
  { value: 25, label: "25 Per page" },
  { value: 50, label: "50 Per page" },
  { value: 100, label: "100 Per page" },
];

function AppTable<T extends Record<string, any>>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  actions,
  isLoading = false,
}: TableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const getPages = (): (number | "…")[] => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "…", totalPages];
    if (page >= totalPages - 2)
      return [1, "…", totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  const handlePageSizeChange = (option: Option<number> | null) => {
    if (option) {
      onPageSizeChange(option.value);
      onPageChange(1);
    }
  };

  const selectedOption =
    pageSizeOptions.find((opt) => opt.value === pageSize) || pageSizeOptions[0];

  return (
    <div className="bg-[var(--bg-0)] text-[var(--text-1)] rounded-2xl shadow w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--bg-2)] text-[var(--text-2)]">
            <tr>
              {columns && columns.length > 0 && columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={` text-left px-6 py-3 text-xs tracking-wider font-normal whitespace-nowrap ${col.headerClassName || ""}`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-xs tracking-wider text-[var(--text-3)] font-normal">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: pageSize > 10 ? 10 : pageSize }).map(
                  (_, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[var(--border-1)] ${i % 2 === 0 ? "bg-[var(--bg-0)]" : "bg-[var(--bg-1)]"}`}
                    >
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-6 py-4">
                          <Skeleton height={16} borderRadius={4} />
                        </td>
                      ))}
                      {actions && (
                        <td className="px-6 py-4">
                          <Skeleton height={16} width={60} borderRadius={4} />
                        </td>
                      )}
                    </tr>
                  ),
                )}
              </>
            ) : !isLoading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-12 text-[var(--text-3)]"
                >
                  <div className="relative w-full h-64 mb-4">
                    <Image
                      src="/no_results_found.svg"
                      alt="No Data Found"
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  
                </td>
              </tr>
            ) : (
             data && data.length > 0 && data.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  className={`border-b border-[var(--border-1)] transition-colors duration-150
                    ${i % 2 === 0 ? "bg-[var(--bg-0)]" : "bg-[var(--bg-1)]"}
                    hover:bg-[var(--bg-3)] cursor-pointer`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-6 py-4 whitespace-nowrap  capitalize text-[var(--text-2)]"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-[var(--text-2)]">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-[var(--border-1)] gap-3">
          <p className="text-xs text-[var(--text-3)]">
            Showing {start}–{end} of {total} records
          </p>

          <div className="flex items-center gap-1">
            <AppSelect<number>
              value={selectedOption}
              onChange={handlePageSizeChange}
              options={pageSizeOptions}
              isSearchable={false}
            />
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-3)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <GrFormPrevious />
            </button>

            {getPages().map((p, idx) =>
              p === "…" ? (
                <span
                  key={idx}
                  className="w-8 h-8 flex items-center justify-center text-[var(--text-3)] text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs transition-colors font-normal ${
                    page === p
                      ? "bg-[var(--bg-4)] text-[var(--text-1)] shadow-sm"
                      : "text-[var(--text-2)] hover:bg-[var(--bg-3)]"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-3)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <GrFormNext />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AppTable) as typeof AppTable;
