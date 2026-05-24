"use client";
import { TbServer } from "react-icons/tb";
import { useState } from "react";
import { TbSettingsAutomation, TbPlug } from "react-icons/tb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { BiCube } from "react-icons/bi";
import { useMe } from "@/hooks/useMe";
import { PiDesktopTower, PiSignOut } from "react-icons/pi";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  PiHouseLine,
  PiFolderOpen,
  PiGear,
  PiCaretDown,
  PiSidebarSimple,
  PiWebhooksLogo,
} from "react-icons/pi";

import api from "@/libs/axios";
import { useMutation } from "@tanstack/react-query";
async function LogoutFn() {
  const res = await api.post("/auth/sign-out");
  return res.data;
}

const nav_items = [
  { id: 1, icon: PiHouseLine, label: "Dashboard", url: "/" },
  { id: 2, icon: PiFolderOpen, label: "Projects", url: "/projects" },
  { id: 3, icon: BiCube, label: "Deployments", url: "/deployments" },
  {
    id: 4,
    icon: TbSettingsAutomation,
    label: "Automation",
    url: "/automation",
  },
  { id: 5, icon: TbServer, label: "Servers", url: "/servers" },
  {
    id: 6,
    icon: PiWebhooksLogo,
    label: "WebHook Events",
    url: "/webhook-events",
  },
  {
    id: 7,
    icon: PiDesktopTower,
    label: "Processes",
    url: "/processes",
  },
];

const settings_children = [
  { label: "Account Settings", url: "/settings/account", id: 1 },
  { label: "Change Password", url: "/settings/change-password", id: 2 },
];

const integrations_children = [
  { label: "E Mail", url: "/integrations/email", id: 1 },
  { label: "Whatsapp", url: "/integrations/whatsapp", id: 2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const route = useRouter()
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/settings"),
  );
  const { data, isLoading } = useMe();
  const [integrationsOpen, setIntegrationsOpen] = useState(
    pathname.startsWith("/integrations"),
  );

  function ToggleSidebar() {
    setCollapsed((prev) => !prev);
  }

  function ToggleSettings() {
    setSettingsOpen((prev) => !prev);
  }

  function ToggleIntegrations() {
    setIntegrationsOpen((prev) => !prev);
  }

  const isSettingsActive = pathname.startsWith("/settings");
  const isIntegrationsActive = pathname.startsWith("/integrations");

  const { mutate } = useMutation({
    mutationFn: LogoutFn,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg);
        return route.push("/sign-in");
      }
    },
  });

  if (isLoading) {
    return (
      <aside className="flex flex-col justify-between h-full w-58 shrink-0 bg-(--bg-0,#08090a) border-r border-(--border-1,#1c1e27)">
     
          <div className="flex items-center justify-between h-14 shrink-0 px-3 pl-4.5 border-b border-(--border-1,#1c1e27)">
            <span className="text-[16px] font-bold tracking-[-0.4px] text-(--text-1,#eeeef5)">
              ⬡ Deploy
              <span style={{ color: "var(--accent, #6366f1)" }}>Dock</span>
            </span>
          </div>
          <SkeletonTheme baseColor="#111318" highlightColor="#1c1e27">
            <div className="py-3 px-1.5 flex flex-col gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center rounded-[10px] px-2.5 py-2 gap-2.75"
                >
                  <Skeleton circle width={19} height={19} />
                  <Skeleton width={90} height={13} />
                </div>
              ))}
              <div className="h-px bg-(--border-1,#1c1e27) mx-1 my-2.5" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center rounded-[10px] px-2.5 py-2 gap-2.75"
                >
                  <Skeleton circle width={19} height={19} />
                  <Skeleton width={80} height={13} />
                </div>
              ))}
            </div>
          </SkeletonTheme>
       



      </aside>
    );
  }

  return (
    <aside
      className={`
    flex flex-col h-full shrink-0 overflow-hidden relative
    bg-(--bg-0,#08090a)
    border-r border-(--border-1,#1c1e27)
    transition-[width] duration-300 ease-in-out
    ${collapsed ? "w-16" : "w-58"}
  `}
    >
      <div
        className={`
    flex items-center h-14 shrink-0
    border-b border-(--border-1,#1c1e27)
    transition-all duration-300 ease-in-out
    ${
      collapsed ? "justify-center py-3.5" : "justify-between px-3 pl-4.5 py-3.5"
    }
  `}
      >
        <span
          className={`
    text-[16px] font-bold tracking-[-0.4px]
    text-(--text-1,#eeeef5)
    whitespace-nowrap overflow-hidden
    transition-all duration-300 ease-in-out
    ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-35"}
  `}
        >
          ⬡ Deploy<span style={{ color: "var(--accent, #6366f1)" }}>Dock</span>
        </span>

        <button
          onClick={ToggleSidebar}
          title={collapsed ? "Expand" : "Collapse"}
          className="
    flex items-center justify-center
    w-8 h-8 shrink-0
    rounded-lg
    text-[#eeeef5]
    bg-transparent
    cursor-pointer
    transition-colors duration-150
    hover:bg-(--bg-3,#191c26)
  "
        >
          <PiSidebarSimple size={19} />
        </button>
      </div>

      <div
        className="py-3 px-1.5 flex-1 overflow-x-hidden overflow-y-auto gap-0.5 flex flex-col"
        style={{ scrollbarWidth: "none" }}
      >
        {!collapsed && (
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-4, #42455a)",
              padding: "0 10px",
              marginBottom: "6px",
              marginTop: "2px",
            }}
          >
            Main
          </p>
        )}

        {nav_items.map(({ id, icon: Icon, label, url }) => {
          const isActive =
            url === "/"
              ? pathname === "/"
              : url === "/teams"
                ? pathname === "/teams"
                : pathname.startsWith(url);
          return (
            <Link
              key={id}
              href={url}
              className={`
        relative flex items-center rounded-[10px]
        text-[13.5px] font-medium no-underline
        text-[#eeeef5] whitespace-nowrap overflow-hidden
        transition-all duration-300
        ${
          collapsed
            ? "justify-center py-2.5"
            : "justify-start gap-2.75 px-2.5 py-2.25"
        }
        ${isActive ? "bg-(--bg-4,#1a1d2b)" : "hover:bg-(--bg-3,#191c26)"}
      `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-[60%] rounded-r bg-(--accent,#6366f1)" />
              )}
              <span
                className="flex items-center justify-center shrink-0 min-w-4.75"
                style={{
                  color: isActive ? "var(--accent, #6366f1)" : "#eeeef5",
                }}
              >
                <Icon size={19} />
              </span>
              <span
                className={`
          overflow-hidden transition-all duration-300
          ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-50"}
          pointer-events-none
        `}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div className="h-px bg-(--border-1,#1c1e27) mx-1 my-2.5" />

        {!collapsed && (
          <p className="text-[10px] font-bold tracking-widest uppercase text-(--text-4,#42455a) px-2.5 mb-1.5">
            Apps
          </p>
        )}

        <button
          onClick={ToggleSettings}
          className={`
    relative w-full flex items-center rounded-[10px]
    text-[13.5px] font-medium text-[#eeeef5]
    transition-all duration-300
    ${collapsed ? "justify-center py-2.5" : "justify-between px-2.5 py-2.25"}
    ${isSettingsActive ? "bg-(--bg-4,#1a1d2b)" : "hover:bg-(--bg-3,#191c26)"}
  `}
        >
          {isSettingsActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-[60%] rounded-r bg-(--accent,#6366f1)" />
          )}
          <span className="flex items-center gap-2.75">
            <PiGear
              size={19}
              className={`shrink-0 ${
                isSettingsActive ? "text-(--accent,#6366f1)" : "text-[#eeeef5]"
              }`}
            />
            {!collapsed && "Settings"}
          </span>
          {!collapsed && (
            <PiCaretDown
              size={13}
              className={`
        shrink-0 text-(--text-4,#42455a)
        transition-transform duration-300
        ${settingsOpen ? "rotate-0" : "-rotate-90"}
      `}
            />
          )}
        </button>

        {!collapsed && (
          <div
            className={`
      overflow-hidden transition-[max-height] duration-300
      ${settingsOpen ? "max-h-50" : "max-h-0"}
    `}
          >
            <div className="flex flex-col gap-0.5 py-1 pl-10">
              {settings_children
                .filter(
                  (item) =>
                    !(
                      data?.provider === "github" &&
                      item.url === "/settings/change-password"
                    ),
                )
                .map(({ label, url, id }) => {
                  const isActive = pathname === url;
                  return (
                    <Link
                      key={id}
                      href={url}
                      className={`
              flex items-center gap-2 px-2.5 py-1.75
              rounded-lg text-[12.5px] font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "text-(--accent,#6366f1) bg-[rgba(99,102,241,0.08)]"
                  : "text-(--text-3,#8b8fa8) hover:bg-(--bg-3,#191c26)"
              }
            `}
                    >
                      <span
                        className={`w-1.25 h-1.25 rounded-full shrink-0 ${
                          isActive
                            ? "bg-(--accent,#6366f1)"
                            : "bg-(--text-4,#42455a)"
                        }`}
                      />
                      {label}
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        <button
          onClick={ToggleIntegrations}
          className={`
    relative w-full flex items-center rounded-[10px]
    text-[13.5px] font-medium text-[#eeeef5]
    transition-all duration-300
    ${collapsed ? "justify-center py-2.5" : "justify-between px-2.5 py-2.25"}
    ${isIntegrationsActive ? "bg-(--bg-4,#1a1d2b)" : "hover:bg-(--bg-3,#191c26)"}
  `}
        >
          {isIntegrationsActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-[60%] rounded-r bg-(--accent,#6366f1)" />
          )}
          <span className="flex items-center gap-2.75">
            <TbPlug
              size={19}
              className={`shrink-0 ${
                isIntegrationsActive
                  ? "text-(--accent,#6366f1)"
                  : "text-[#eeeef5]"
              }`}
            />
            {!collapsed && "Integrations"}
          </span>
          {!collapsed && (
            <PiCaretDown
              size={13}
              className={`
        shrink-0 text-(--text-4,#42455a)
        transition-transform duration-300
        ${integrationsOpen ? "rotate-0" : "-rotate-90"}
      `}
            />
          )}
        </button>

        {!collapsed && (
          <div
            className={`
      overflow-hidden transition-[max-height] duration-300
      ${integrationsOpen ? "max-h-50" : "max-h-0"}
    `}
          >
            <div className="flex flex-col gap-0.5 py-1 pl-10">
              {integrations_children.map(({ label, url, id }) => {
                const isActive = pathname === url;
                return (
                  <Link
                    key={id}
                    href={url}
                    className={`
              flex items-center gap-2 px-2.5 py-1.75
              rounded-lg text-[12.5px] font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "text-(--accent,#6366f1) bg-[rgba(99,102,241,0.08)]"
                  : "text-(--text-3,#8b8fa8) hover:bg-(--bg-3,#191c26)"
              }
            `}
                  >
                    <span
                      className={`w-1.25 h-1.25 rounded-full shrink-0 ${
                        isActive
                          ? "bg-(--accent,#6366f1)"
                          : "bg-(--text-4,#42455a)"
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className={`shrink-0 border-t border-(--border-1,#1c1e27) px-1.5 py-2`}>
        <button
          onClick={() => mutate() }
          className={`
            relative w-full flex items-center rounded-[10px]
            text-[13.5px] font-medium text-[#eeeef5]
            transition-all duration-300
            hover:bg-[rgba(239,68,68,0.08)] hover:text-red-400
            ${collapsed ? "justify-center py-2.5" : "gap-2.75 px-2.5 py-2.25"}
          `}
        >
          <PiSignOut size={19} className="shrink-0" />
          <span
            className={`
              overflow-hidden transition-all duration-300
              ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-50"}
              pointer-events-none
            `}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
