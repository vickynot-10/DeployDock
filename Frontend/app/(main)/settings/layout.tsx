"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import { useMe } from "@/hooks/useMe";
const SETTINGS_TABS = [
  { label: "Account", url: "/settings/account" },
  { label: "Change Password", url: "/settings/change-password" },
];

export default function SettingsMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });
  const { data } = useMe();
  useEffect(() => {
    const activeBtn = tabsRef.current?.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    if (activeBtn) {
      setPillStyle({
        width: activeBtn.offsetWidth,
        x: activeBtn.offsetLeft - 3,
      });
    }
  }, [pathname]);

  const paths = pathname.split("/").filter(Boolean);

  const breadcrumbItems = paths.map((segment, index) => {
    const url = "/" + paths.slice(0, index + 1).join("/");

    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      label,
      url,
      active: index === paths.length - 1,
    };
  });
  useEffect(() => {
    if (
      data?.provider === "github" &&
      pathname === "/settings/change-password"
    ) {
      router.replace("/settings/account");
    }
  }, [data, pathname, router]);

  return (
    <>
      <div className=" mb-3 flex flex-row items-center justify-between w-full">
        {data && data.provider !== "github" && (
          <div
            ref={tabsRef}
            className="relative flex gap-0 bg-[var(--bg-1)] border border-[var(--border-1)] rounded-[10px] p-[3px] w-fit"
          >
            <div
              className="absolute top-[3px] h-[calc(100%-6px)] bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[7px] pointer-events-none z-0"
              style={{
                width: pillStyle.width,
                transform: `translateX(${pillStyle.x}px)`,
                transition:
                  "transform 0.22s cubic-bezier(0.35,0,0.25,1), width 0.22s cubic-bezier(0.35,0,0.25,1)",
              }}
            />

            {SETTINGS_TABS.map(({ label, url }) => {
              const isActive = pathname === url;
              return (
                <button
                  key={url}
                  data-active={isActive}
                  onClick={() => router.push(url)}
                  className={`
              relative z-10 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium
              border border-transparent transition-colors duration-150 whitespace-nowrap
              ${isActive ? "text-[var(--text-1)]" : "text-[var(--text-4)] hover:text-[var(--text-2)]"}
            `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className=" flex justify-end  flex-1">
          <BreadCrumbs items={breadcrumbItems} />
        </div>
      </div>

      {children}
    </>
  );
}
