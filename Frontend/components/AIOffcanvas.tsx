"use client";
import { AiOutlineWechatWork } from "react-icons/ai";
import api from "@/libs/axios";
import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { PiXLight, PiArrowUpLight } from "react-icons/pi";
import { use_ai_chat_context } from "@/contexts/AIChatContext";
import { useMe } from "@/hooks/useMe";

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

type ApiPayload = {
  system: string;
  messages: { role: string; content: string }[];
};

const get_time = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";

  return "Good Night";
};

export default function AIChatOffcanvas() {
  const { context } = use_ai_chat_context();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messages_end_ref = useRef<HTMLDivElement>(null);
  const textarea_ref = useRef<HTMLTextAreaElement>(null);

  const { data } = useMe();

  useEffect(() => {
    messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => textarea_ref.current?.focus(), 300);
  }, [open]);

  const build_system_prompt = useCallback(() => {
    let prompt = ``;
    if (context.project_name)
      prompt += `\n\nCurrent project: ${context.project_name}`;
    if (context.last_deploy_status)
      prompt += `\nLast deployment status: ${context.last_deploy_status}`;
    if (context.recent_logs)
      prompt += `\n\nRecent logs:\n${context.recent_logs}`;
    return prompt;
  }, [context]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: ApiPayload) =>
      api.post("/ai", payload).then((r) => r.data.result as string),
    onSuccess: (reply) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, time: get_time() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not connect to AI. Please try again.",
          time: get_time(),
        },
      ]);
    },
  });

  const send_message = (text: string) => {
    if (!text.trim() || isPending) return;
    const user_msg: Message = { role: "user", content: text, time: get_time() };
    const updated = [...messages, user_msg];
    setMessages(updated);
    setInput("");
    if (textarea_ref.current) textarea_ref.current.style.height = "auto";
    mutate({
      system: build_system_prompt(),
      messages: updated.map(({ role, content }) => ({ role, content })),
    });
  };

  const on_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send_message(input);
    }
  };

  const on_input_change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Ask AI"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: "var(--accent)",
          boxShadow: "0 4px 20px rgba(113,112,255,0.35)",
          opacity: open ? 0 : 1,
          pointerEvents: open ? "none" : "auto",
          transition: "opacity 0.2s",
        }}
      >
        <AiOutlineWechatWork size={22} color="#fff" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      <div
        className="fixed top-0 right-0 h-full  z-[999] flex flex-col bg-black  w-[50%]"
        style={{
          borderLeft: "1px solid var(--border-1)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-1)" }}
        >
          <div className="flex items-center gap-2">
            <AiOutlineWechatWork size={17} style={{ color: "var(--accent)" }} />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-1)" }}
            >
              DeployDock AI
            </span>
            {context.project_name && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--accent-tint)",
                  color: "var(--accent)",
                }}
              >
                {context.project_name}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-4)" }}
          >
            <PiXLight size={16} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto flex flex-col"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#222 transparent" }}
        >
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
              <AiOutlineWechatWork
                size={32}
                style={{ color: "var(--text-4)" }}
              />
              <p
                className="text-sm text-center"
                style={{ color: "var(--text-4)" }}
              >
                {getGreeting()}
                {data?.name ? `, ${data.name}` : ""} 👋
              </p>
            </div>
          )}
          {messages && messages.length > 0 && (
            <div className="flex flex-col gap-6 px-4 py-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.role === "user" ? (
                    <div
                      className="max-w-[85%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: "var(--bg-3)",
                        color: "var(--text-1)",
                        borderRadius: "18px 18px 4px 18px",
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className="text-sm w-full whitespace-pre-wrap"
                      style={{ color: "var(--text-2)", lineHeight: 1.65 }}
                    >
                      {msg.content}
                    </div>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-4)" }}>
                    {msg.time}
                  </span>
                </div>
              ))}

              {isPending && (
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "var(--text-4)",
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div ref={messages_end_ref} />
            </div>
          )}
        </div>

        <div className="px-4 pb-5 pt-3 flex-shrink-0">
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-3"
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border-2)",
            }}
          >
            <textarea
              ref={textarea_ref}
              value={input}
              onChange={on_input_change}
              onKeyDown={on_key_down}
              placeholder="What do you want to know?"
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm"
              style={{
                color: "var(--text-1)",
                minHeight: 24,
                maxHeight: 120,
                fontFamily: "inherit",
                lineHeight: 1.55,
              }}
            />
            <button
              onClick={() => send_message(input)}
              disabled={isPending || !input.trim()}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() ? "var(--text-1)" : "var(--bg-4)",
              }}
            >
              <PiArrowUpLight
                size={14}
                style={{
                  color: input.trim() ? "var(--bg-0)" : "var(--text-4)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
