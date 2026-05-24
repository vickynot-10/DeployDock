"use client";
import Loader from "./Loader";
import { memo, useEffect, useRef } from "react";
import { PiX } from "react-icons/pi";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  submit_text: string;
  variant: "primary" | "danger";
  onSubmit: () => void;
  isLoading?: boolean;
}

function AppModal({
  open,
  onClose,
  title,
  children,
  submit_text,
  width = "480px",
  height,
  variant,
  onSubmit,
  isLoading,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const submitColor =
    variant === "danger"
      ? "text-red-400 hover:text-red-300"
      : "text-[var(--accent)] hover:text-[var(--accent-hover)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        style={{ width, maxWidth: "calc(100vw - 32px)", height }}
        className="flex flex-col bg-[var(--bg-1)] border border-[var(--border-1)] rounded-xl max-h-[90vh]"
      >
       {" "}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-1)] shrink-0">
          {title && (
            <h2 className="text-[15px] font-medium text-[var(--text-1)]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-4)] hover:text-[var(--text-1)] hover:bg-[var(--bg-3)] transition-colors"
          >
            <PiX size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex items-center border-t border-[var(--border-1)] shrink-0 h-12">
          <button
            onClick={onClose}
            
            disabled={isLoading}
            className="flex-1 h-full tracking-wider uppercase text-[13px] font-medium text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-3)] transition-colors rounded-bl-xl"
          >
            Cancel
          </button>

          <div className="w-px h-full bg-[var(--border-1)]" />

          <button
            onClick={onSubmit}
            disabled={isLoading}
            className={`flex-1 uppercase text-center flex items-center justify-center   tracking-wider h-full text-[13px] font-medium transition-colors rounded-br-xl hover:bg-[var(--bg-3)] disabled:opacity-50 ${submitColor}`}
          >
            {isLoading ? <Loader color="white" /> : submit_text}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AppModal);
