"use client";
import { useState } from "react";
import React from "react";
import { AnimatePresence, Transition, Variants, motion } from "motion/react";
import { cn } from "@/lib/utils";
import GitHubTab from "../../../components/Githubtab";
import DockerTab from "../../../components/DockerTab";

import { Props } from "@/types/services.types";
import { useBreadcrumbItems } from "@/contexts/breadcrumb-provider";

const TABS = ["GitHub", "Docker"];

export default function CreateNewService({ id, type }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useBreadcrumbItems([
    {
      label: "Services",
      href: id ? `/projects/${id}` : "/projects",
    },
    { label: "Create Service" },
  ]);

  const changeTab = (index: number) => {
    if (index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  return (
    <div className="w-full ">
      <div className="mb-4 flex space-x-2">
        {TABS.map((title, index) => (
          <button
            key={title}
            type="button"
            onClick={() => changeTab(index)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeIndex === index
                ? "bg-primary text-background"
                : "text-foreground hover:bg-accent",
            )}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="border-t border-border pb-5 ">
        <TransitionPanel activeIndex={activeIndex} direction={direction}>
          <GitHubTab id={id} type={type} isEdit={false} />
          <DockerTab id={id} type={type} isEdit={false} />
        </TransitionPanel>
      </div>
    </div>
  );
}

type TransitionPanelProps = {
  children: React.ReactNode[];
  className?: string;
  transition?: Transition;
  activeIndex: number;
  direction?: number;
};

const variants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40, filter: "blur(4px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, filter: "blur(4px)" }),
};

export function TransitionPanel({
  children,
  className,
  transition = { duration: 0.2, ease: "easeInOut" },
  activeIndex,
  direction = 1,
}: TransitionPanelProps) {
  return (
    <div className={cn("relative pt-5 pe-5", className)}>
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={variants}
          transition={transition}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
