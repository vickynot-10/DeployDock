"use client";

import { createContext, useContext, useState, useCallback } from "react";

type AIChatContext = {
  project_name?: string;
  last_deploy_status?: string;
  recent_logs?: string;
};

type AIChatContextType = {
  context: AIChatContext;
  set_context: (ctx: AIChatContext) => void;
  clear_context: () => void;
};

const AIChatContext = createContext<AIChatContextType | null>(null);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [context, set_context_state] = useState<AIChatContext>({});

  const set_context = useCallback((ctx: AIChatContext) => {
    set_context_state(ctx);
  }, []);

  const clear_context = useCallback(() => {
    set_context_state({});
  }, []);

  return (
    <AIChatContext.Provider value={{ context, set_context, clear_context }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function use_ai_chat_context() {
  const ctx = useContext(AIChatContext);
  if (!ctx)
    throw new Error("use_ai_chat_context must be used inside AIChatProvider");
  return ctx;
}
