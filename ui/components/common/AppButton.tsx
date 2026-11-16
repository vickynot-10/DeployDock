"use client";

import * as React from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react";
import { Loader2, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MotionButton = motion.create(Button);

interface MultiStateSendButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children" | "onAnimationStart"
> {
  idleLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  sendDuration?: number;
  autoResetDelay?: number;
  onSend?: () => void;
  icon?: LucideIcon;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}

const AppButton = React.forwardRef<
  HTMLButtonElement,
  MultiStateSendButtonProps
>(
  (
    {
      idleLabel = "Send Message",
      loadingLabel = "Sending...",
      successLabel = "Sent Successfully!",
      sendDuration = 1800,
      autoResetDelay = 3000,
      onSend,
      icon: Icon,
      isLoading,
      variant = "primary",
      className,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [internalStatus, setInternalStatus] = React.useState<
      "idle" | "loading" | "success"
    >("idle");

    const status =
      isLoading !== undefined
        ? isLoading
          ? "loading"
          : internalStatus === "success"
            ? "success"
            : "idle"
        : internalStatus;

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (status !== "idle") return;

      if (isLoading === undefined) {
        setInternalStatus("loading");

        setTimeout(() => {
          setInternalStatus("success");
          if (onSend) onSend();

          if (autoResetDelay > 0) {
            setTimeout(() => {
              setInternalStatus("idle");
            }, autoResetDelay);
          }
        }, sendDuration);
      }

      if (onClick) onClick(e);
    }

    if (variant === "secondary") {
      return (
        <MotionButton
          ref={ref}
          variant="secondary"
          size="lg"
          onClick={onClick}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.97 }}
          className={cn(" gap-2.5 overflow-hidden rounded-sm", className)}
          {...props}
        >
          <span className="relative z-10 flex items-center gap-2">
            {Icon && <Icon className="size-4" />}
            <span>{idleLabel}</span>
          </span>
        </MotionButton>
      );
    }

    return (
      <MotionButton
        ref={ref}
        variant="default"
        size="lg"
        onClick={handleClick}
        disabled={isLoading || disabled || status !== "idle"}
        whileHover={{ scale: status === "idle" ? 1.02 : 1 }}
        whileTap={{ scale: status === "idle" ? 0.97 : 1 }}
        className={cn(
          "group  gap-2.5 overflow-hidden rounded-sm disabled:opacity-100",
          disabled && "opacity-60",
          className,
        )}
        {...props}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center gap-2"
            >
              {Icon && (
                <Icon className="size-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
              <span>{idleLabel}</span>
            </motion.span>
          )}

          {status === "loading" && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center gap-2"
            >
              <Loader2 className="size-4 animate-spin" />
              <span>{loadingLabel}</span>
            </motion.span>
          )}

          {status === "success" && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="relative z-10 flex items-center gap-2"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{successLabel}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </MotionButton>
    );
  },
);

AppButton.displayName = "AppButton";

export { AppButton, type MultiStateSendButtonProps };
