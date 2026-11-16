import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

type TooltipSide = "top" | "bottom" | "right" | "left";

interface TooltipProps {
  content: React.ReactNode;
  side?: TooltipSide;
  children: React.ReactNode;
}

const initialOffset: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 6 },
  bottom: { y: -6 },
  right: { x: -6 },
  left: { x: 6 },
};

function getPosition(rect: DOMRect, side: TooltipSide) {
  const gap = 8;
  switch (side) {
    case "top":
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    case "bottom":
      return { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: "translate(-50%, 0)" };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: "translate(0, -50%)" };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: "translate(-100%, -50%)" };
  }
}

export default function Tooltip({ content, side = "top", children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, [open]);

  const pos = rect ? getPosition(rect, side) : null;

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <div
                style={{ position: "fixed", top: pos.top, left: pos.left, transform: pos.transform }}
                className="z-popover"
              >
                <motion.span
                  role="tooltip"
                  initial={{ opacity: 0, scale: 0.9, ...initialOffset[side] }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, ...initialOffset[side] }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="pointer-events-none block whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-md"
                >
                  {content}
                </motion.span>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}