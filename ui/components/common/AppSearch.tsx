"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SearchIcon,
  Workflow,
  Activity,
  ScrollText,
  Gauge,
  Settings,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";

type NavItem =
  | {
      title: string;
      icon: LucideIcon;
      href: string;
      isSection?: never;
      label?: never;
    }
  | {
      isSection: true;
      label: string;
      title?: never;
      icon?: never;
      href?: never;
    };

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", isSection: true },
  { title: "Projects", icon: Workflow, href: "/" },
  { title: "Deployments", icon: Activity, href: "/deployments" },
  { title: "Logs", icon: ScrollText, href: "/logs" },
  { title: "Metrics", icon: Gauge, href: "/metrics" },
  { label: "Account", isSection: true },
  { title: "Settings", icon: Settings, href: "/settings" },
];

export default function SearchDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    setIsOpen(false);
    setSearchQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function handleNavigate(href: string) {
    setIsOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.isSection) return true;
    if (!searchQuery.trim()) return true;
    return item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const visibleItems = filteredItems.filter((item, index) => {
    if (!item.isSection) return true;
    const next = filteredItems[index + 1];
    return next && !next.isSection;
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon />
        <span className="sr-only">Search</span>
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setSearchQuery("");
        }}
      >
        <DialogContent className="gap-0 p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">Search</DialogTitle>
            <DialogDescription className="sr-only">
              Search the app
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSearch}
            role="search"
            className="relative border-b"
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search_query"
              type="search"
              placeholder="Search or jump to..."
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-0 pl-10 h-12 rounded-none focus-visible:ring-0 shadow-none bg-transparent"
            />
          </form>

          <div className="py-2">
            <AnimatePresence initial={false}>
              {visibleItems.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No results for &ldquo;{searchQuery}&rdquo;
                </motion.p>
              ) : (
                visibleItems.map((item, i) => {
                  if (item.isSection) {
                    return (
                      <motion.p
                        key={item.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15, delay: i * 0.03 }}
                        className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {item.label}
                      </motion.p>
                    );
                  }

                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.href}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                      whileHover={{ x: 3 }}
                      onClick={() => handleNavigate(item.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span>{item.title}</span>
                    </motion.button>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
