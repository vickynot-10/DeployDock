import { memo, ReactElement } from "react";

type TooltipProps = {
  content: string | ReactElement;
  children: any;
  placement?: "center" | "left" | "right";
  direction?: "top" | "bottom";
};

function TooltipWrapper({
  content,
  children,
  placement = "center",
  direction = "top",
}: TooltipProps) {
  const positionClass =
    placement === "right"
      ? "right-0"
      : placement === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  const directionClass =
    direction === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className="relative inline-flex group tool-tip">
      {children}
      <span
        className={`absolute ${directionClass} px-2.5 py-1.5 text-xs font-medium rounded-md 
  bg-[var(--bg-4)] text-[var(--text-1)] 
  border border-[var(--border-2)] 
  shadow-lg shadow-black/40
  whitespace-nowrap opacity-0 scale-95 
  group-hover:opacity-100 group-hover:scale-100 
  transition-all duration-150 pointer-events-none z-50 ${positionClass}`}
      >
        {content}
      </span>
    </span>
  );
}


export default memo(TooltipWrapper);
