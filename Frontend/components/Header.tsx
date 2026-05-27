"use client";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { PiUserCircle, PiSignOut } from "react-icons/pi";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaGithub, FaUserEdit } from "react-icons/fa";
import { useMe } from "@/hooks/useMe";
import Link from "next/link";

async function LogoutFn() {
  const res = await api.post("/auth/sign-out");
  return res.data;
}

export default function Header() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { mutate } = useMutation({
    mutationFn: LogoutFn,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.msg);
        return router.push("/sign-in");
      }
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <header className="flex items-center h-14 shrink-0 border-b border-[var(--border-1)] justify-between px-4 py-3.5 bg-[var(--bg-0)]">
        <div className="w-24 h-7 rounded-md bg-[var(--bg-2)] animate-pulse" />

        <div className="flex items-center gap-2">
          <div className="w-[52px] h-[26px] rounded-full bg-[var(--bg-2)] animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-[var(--bg-2)] animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex  h-14 shrink-0 border-b border-[var(--border-1)] px-4 py-3.5 bg-[var(--bg-0)]">
      <div className="flex flex-row w-full items-center justify-end gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent text-[#eeeef5] hover:bg-[var(--bg-4)] transition"
          >
            <PiUserCircle size={22} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden bg-[var(--bg-2)] border border-[var(--border-1)] shadow-lg z-50">
              {data && (
                <div className="px-3 py-2.5 border-b border-[var(--border-1)]">
                  <p className="text-sm font-medium text-[#eeeef5] mb-0.5">
                    {data.name}
                  </p>
                  <p className="text-xs text-[var(--text-4)]">{data.email}</p>
                </div>
              )}

              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-3)] transition"
                onClick={() => router.push("/settings/account")}
              >
                <FaUserEdit size={16} />
                Edit Profile
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[var(--bg-3)] transition"
                onClick={() => mutate()}
              >
                <PiSignOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        <Link
          href="https://github.com/vickynot-10/DeployDock/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-transparent border-0 flex ms-2 items-center justify-center"
        >
          <FaGithub />
        </Link>
      </div>
    </header>
  );
}
