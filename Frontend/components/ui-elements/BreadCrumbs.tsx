"use client";
import { memo } from "react";
import Link from "next/link";
import { HiOutlineHome } from "react-icons/hi";
interface BreadcrumbItem {
  label: string;
  url?: string;
  active: boolean;
}

interface PageHeaderProps {
  items: BreadcrumbItem[];
}

const BreadCrumbs = memo(({ items }: PageHeaderProps) => {
  return (
    <div className="flex items-center  justify-end flex-row w-full px-1 py-2">
    
      {items.length > 0 && (
        <nav aria-label="breadcrumb" className="flex items-center">
          <Link
            href="/"
            className="text-[var(--text-4)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            <HiOutlineHome size={15} />
          </Link>
          <ol className="flex flex-nowrap items-center">
            {items.map((item, index: number) => (
              <li
                key={item.url ?? `${item.label}-${index}`}
                className="flex items-center"
              >
                <span className="mx-1.5 w-1 h-1 rounded-full bg-[var(--border-3)] shrink-0" />
                {item.active || !item.url ? (
                  <span
                    aria-current={item.active ? "page" : undefined}
                    className="text-xs font-medium text-[var(--text-2)] whitespace-nowrap"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-150 whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
});

BreadCrumbs.displayName = "BreadCrumbs";

export default BreadCrumbs;
