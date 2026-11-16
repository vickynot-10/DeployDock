"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronRight,
  DotIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useBreadcrumbs,
  type BreadcrumbEntry,
} from "@/contexts/breadcrumb-provider";
import SearchDialog from "@/components/common/AppSearch";

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { items } = useBreadcrumbs();
  const { resolvedTheme, setTheme } = useTheme();

  const segments = pathname.split("/").filter(Boolean);
  const derivedCrumbs: BreadcrumbEntry[] = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }));
  const crumbs = items ?? derivedCrumbs;

  function handleThemeToggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <Breadcrumb className="hidden min-w-0 md:block">
          <BreadcrumbList className="h-8 flex-nowrap gap-2 rounded-lg border px-3 text-sm">
            <li className="mr-1 flex items-center rounded-full bg-muted px-1.5 py-0.5">
              <button type="button" onClick={() => router.back()}>
                <ChevronLeft size={16} className="text-foreground" />
                <span className="sr-only">Go back</span>
              </button>
              <button type="button" onClick={() => router.forward()}>
                <ChevronRight size={16} className="text-foreground/60" />
                <span className="sr-only">Go forward</span>
              </button>
            </li>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                <HomeIcon className="size-4" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <Fragment key={`${crumb.href ?? "text"}-${index}`}>
                  <BreadcrumbSeparator>
                    <DotIcon className="size-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem className="min-w-0">
                    {isLast ? (
                      <BreadcrumbPage className="max-w-48 truncate">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : crumb.href ? (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <span className="text-muted-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <SearchDialog />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleThemeToggle}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="block dark:hidden" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
