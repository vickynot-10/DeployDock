"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as React from "react";
import {
  ChevronRight,
  LucideIcon,
  Workflow,
  LogOut,
  Loader2,
  ArrowLeft,
  Rocket,
  Settings,
  ScrollText,
  Activity,
  Plug,
  Gauge,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useSignout } from "@/hooks/queries/useAuth";
import Link from "next/link";
export type NavItem = {
  label?: string;
  isSection?: boolean;
  loading?: boolean;
  title?: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  children?: NavItem[];
};
export const navData: NavItem[] = [
  { label: "Overview", isSection: true },
  { title: "Projects", icon: Workflow, href: "/" },
  { title: "Deployments", icon: Activity, href: "/deployments" },
  { title: "Logs", icon: ScrollText, href: "/logs" },
  { title: "Metrics", icon: Gauge, href: "/metrics" },
  { label: "Account", isSection: true },
  { title: "Settings", icon: Settings, href: "/settings" },
];
export function AppSidebar() {
  const { mutate, isPending } = useSignout();
  const router = useRouter();
  const pathname = usePathname();
  const match = pathname.match(SERVICE_PATH);
  const isService = !!match;
  const serviceType = match?.[1];
  const serviceId = match?.[2] ?? "";
  const base = `/services/${serviceType}/${serviceId}`;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  const serviceItems: NavItem[] = [
    { title: "Back", icon: ArrowLeft, onClick: goBack },

    { title: "Deploys", icon: Rocket, href: `${base}/deploys` },
    { title: "Settings", icon: Settings, href: `${base}/settings` },
  ];
  return (
    <Sidebar className="px-0 h-full [&_[data-slot=sidebar-inner]]:h-full">
      <div className="flex h-full flex-col gap-6">
        <SidebarHeader className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/"></Link>
              <svg
                width="147"
                height="40"
                viewBox="0 0 147 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id="dd-circle-clip">
                    <circle cx="73.5" cy="20" r="20" />
                  </clipPath>
                </defs>

                {/* Solid circle, full brightness */}
                <circle
                  cx="73.5"
                  cy="20"
                  r="20"
                  fill="#030712"
                  className="dark:fill-[#FFFFFF]"
                />

                {/* Text in normal color (visible outside the circle) */}
                <text
                  x="73.5"
                  y="26.3"
                  textAnchor="middle"
                  fontSize="19"
                  fontWeight="500"
                  fill="#030712"
                  className="dark:fill-[#FFFFFF]"
                  style={{ fontFamily: "inherit" }}
                >
                  DeployDock
                </text>

                {/* Same text in inverted color, visible only inside the circle */}
                <text
                  x="73.5"
                  y="26.3"
                  textAnchor="middle"
                  fontSize="19"
                  fontWeight="500"
                  fill="white"
                  className="dark:fill-[#030712]"
                  clipPath="url(#dd-circle-clip)"
                  style={{ fontFamily: "inherit" }}
                >
                  DeployDock
                </text>
              </svg>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isService ? "service" : "main"}
                  initial={{ opacity: 0, x: isService ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isService ? 24 : -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavMain items={isService ? serviceItems : navData} />
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="px-4 pb-4">
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            {isPending ? "Signing out..." : "Sign Out"}
          </Button>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

const SERVICE_PATH = /^\/services\/(static|web)\/([^/]+)/;

function NavMain({ items }: { items: NavItem[] }) {
  const [activeParent, setActiveParent] = React.useState<string | null>(
    items.find((i) => !i.isSection)?.title || null,
  );
  const [activeChild, setActiveChild] = React.useState<string | null>(null);

  return (
    <>
      {items.map((item, index) => (
        <NavMainItem
          key={item.title || item.label || index}
          item={item}
          activeParent={activeParent}
          setActiveParent={setActiveParent}
          activeChild={activeChild}
          setActiveChild={setActiveChild}
        />
      ))}
    </>
  );
}

function NavMainItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
}) {
  const hasChildren = !!item.children?.length;
  const pathname = usePathname();
  const isParentActive = item.href
    ? item.href === "/"
      ? pathname === "/" || pathname.startsWith("/projects")
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  const [isOpen, setIsOpen] = React.useState(isParentActive);

  // Sync open state when activeParent changes
  React.useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [isParentActive]);

  // Section label
  if (item.isSection && item.label) {
    return (
      <SidebarGroup className="p-0 pt-5 first:pt-0">
        <SidebarGroupLabel className="p-0 text-xs font-medium uppercase text-sidebar-foreground">
          {item.label}
        </SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  // Item with children → collapsible
  if (hasChildren && item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <SidebarMenuItem>
              <CollapsibleTrigger
                className="w-full"
                render={
                  <SidebarMenuButton
                    id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    tooltip={item.title}
                    isActive={isParentActive}
                    onClick={() => setActiveParent(item.title!)}
                    className={cn(
                      "rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer",
                      isParentActive
                        ? "bg-primary! text-primary-foreground!"
                        : "",
                    )}
                  >
                    {item.icon && <item.icon size={16} />}
                    <span>{item.title}</span>
                    <ChevronRight
                      className={cn(
                        "ml-auto transition-transform duration-200",
                        isOpen && "rotate-90",
                      )}
                    />
                  </SidebarMenuButton>
                }
              />
              <CollapsibleContent>
                <SidebarMenuSub className="me-0 pe-0">
                  {item.children!.map((child, index) => (
                    <NavMainSubItem
                      key={child.title || index}
                      item={child}
                      activeParent={activeParent}
                      setActiveParent={setActiveParent}
                      activeChild={activeChild}
                      setActiveChild={setActiveChild}
                      parentTitle={item.title}
                    />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Item without children
  if (item.title) {
    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              tooltip={item.title}
              isActive={isParentActive}
              onClick={() => {
                setActiveParent(item.title!);
                setActiveChild(null);
                item.onClick?.();
              }}
              render={item.href ? <Link href={item.href} /> : undefined}
              className={cn(
                "rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer",
                isParentActive ? "bg-primary! text-primary-foreground!" : "",
              )}
            >
              {item.icon && <item.icon />}
              {item.title}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return null;
}

function NavMainSubItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
  parentTitle,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
  parentTitle?: string;
}) {
  const hasChildren = !!item.children?.length;
  const [isOpen, setIsOpen] = React.useState(false);

  if (hasChildren && item.title) {
    return (
      <SidebarMenuSubItem>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            className="w-full"
            render={
              <SidebarMenuSubButton
                id={`nav-sub-trigger-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-md text-sm font-medium px-3 py-2 h-9"
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </SidebarMenuSubButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub className="me-0 pe-0">
              {item.children!.map((child, index) => (
                <NavMainSubItem
                  key={child.title || index}
                  item={child}
                  activeParent={activeParent}
                  setActiveParent={setActiveParent}
                  activeChild={activeChild}
                  setActiveChild={setActiveChild}
                  parentTitle={parentTitle}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  if (item.title) {
    return (
      <SidebarMenuSubItem className="w-full">
        <SidebarMenuSubButton
          id={`nav-sub-button-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
          className={cn(
            "w-full rounded-md transition-colors",
            activeChild === item.title ? "bg-muted! text-foreground!" : "",
          )}
          isActive={activeChild === item.title}
          onClick={() => {
            setActiveParent(parentTitle || "");
            setActiveChild(item.title!);
          }}
          render={<a href={item.href}>{item.title}</a>}
        />
      </SidebarMenuSubItem>
    );
  }

  return null;
}
