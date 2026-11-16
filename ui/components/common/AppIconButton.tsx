import { forwardRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Tooltip from "./ToolTip";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "right" | "left";

interface AppIconButtonProps extends React.ComponentProps<typeof Button> {
  icon: React.ReactNode;
  tooltip?: React.ReactNode;
  side?: TooltipSide;
  href?: string;
}

const AppIconButton = forwardRef<HTMLButtonElement, AppIconButtonProps>(
  (
    {
      icon,
      tooltip,
      side = "top",
      href,
      className,
      variant = "ghost",
      size = "icon",
      ...props
    },
    ref,
  ) => {
    if (href) {
      return (
        <Tooltip content={tooltip} side={side}>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn("h-8 w-8", className)}
            render={<Link href={href}>{icon}</Link>}
          ></Button>
        </Tooltip>
      );
    }

    if (tooltip) {
      return (
        <Tooltip content={tooltip} side={side}>
          <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn("h-8 w-8", className)}
            {...props}
          >
            {icon}
          </Button>
        </Tooltip>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("h-8 w-8", className)}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);

AppIconButton.displayName = "AppIconButton";

export default AppIconButton;
