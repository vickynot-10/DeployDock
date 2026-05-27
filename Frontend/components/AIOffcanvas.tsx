"use client";
import api from "@/libs/axios";
import { useState, useRef, useEffect, useCallback } from "react";
import { PiRobotLight, PiXLight, PiPaperPlaneTiltLight } from "react-icons/pi";
import { use_ai_chat_context } from "@/contexts/AIChatContext";

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

const SUGGESTIONS = [
  "Why did my last deployment fail?",
  "What does this build error mean?",
  "How do I rollback to the previous build?",
];

const get_time = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AIChatOffcanvas() {
  const { context } = use_ai_chat_context();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messages_end_ref = useRef<HTMLDivElement>(null);
  const textarea_ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    let prompt = `You are an AI assistant embedded inside DeployDock, a self-hosted CI/CD platform.
Help users understand deployment logs, diagnose build errors, explain PM2 process issues, and answer deployment-related questions.
Keep answers concise and practical. No markdown formatting.`;

    if (context.project_name)
      prompt += `\n\nCurrent project: ${context.project_name}`;
    if (context.last_deploy_status)
      prompt += `\nLast deployment status: ${context.last_deploy_status}`;
    if (context.recent_logs)
      prompt += `\n\nRecent logs:\n${context.recent_logs}`;

    return prompt;
  }, [context]);

  const send_message = async (text: string) => {
    if (!text.trim() || loading) return;

    const user_msg: Message = { role: "user", content: text, time: get_time() };
    const updated = [...messages, user_msg];

    setMessages(updated);
    setInput("");
    setLoading(true);

    if (textarea_ref.current) textarea_ref.current.style.height = "auto";

    try {

        await api.post("/ai")

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: build_system_prompt(),
          messages: updated.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const reply: string =
        data.reply ?? "Something went wrong. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, time: get_time() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not connect to AI. Please try again.",
          time: get_time(),
        },
      ]);
    }

    setLoading(false);
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
        <PiRobotLight size={22} color="#fff" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 360,
          background: "var(--bg-1)",
          borderLeft: "1px solid var(--border-2)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-1)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-tint)" }}
          >
            <PiRobotLight size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-1)" }}
            >
              DeployDock AI
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {context.project_name
                ? `Context: ${context.project_name}`
                : "Ask about your deployments"}
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-3)" }}
          >
            <PiXLight size={17} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-8">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-tint)" }}
              >
                <PiRobotLight size={22} style={{ color: "var(--accent)" }} />
              </div>
              <p
                className="text-sm font-medium text-center"
                style={{ color: "var(--text-1)" }}
              >
                How can I help?
              </p>
              <p
                className="text-[11.5px] text-center"
                style={{ color: "var(--text-4)", lineHeight: 1.55 }}
              >
                Ask about deployments, PM2 processes, or build errors
              </p>
              <div className="flex flex-col gap-2 w-full mt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send_message(s)}
                    className="text-left text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: "var(--bg-3)",
                      border: "1px solid var(--border-2)",
                      color: "var(--text-2)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className="max-w-[88%] px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? {
                            background: "var(--accent)",
                            color: "#fff",
                            borderRadius: "10px 10px 3px 10px",
                          }
                        : {
                            background: "var(--bg-3)",
                            color: "var(--text-2)",
                            border: "1px solid var(--border-1)",
                            borderRadius: "10px 10px 10px 3px",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                  <span
                    className="px-1"
                    style={{ fontSize: 10, color: "var(--text-4)" }}
                  >
                    {msg.time}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex flex-col items-start gap-1">
                  <div
                    className="px-3 py-3 flex gap-1 items-center"
                    style={{
                      background: "var(--bg-3)",
                      border: "1px solid var(--border-1)",
                      borderRadius: "10px 10px 10px 3px",
                    }}
                  >
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          background: "var(--text-4)",
                          animationDelay: `${delay}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messages_end_ref} />
        </div>

        <div
          className="p-3 flex gap-2 items-end flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-1)" }}
        >
          <textarea
            ref={textarea_ref}
            value={input}
            onChange={on_input_change}
            onKeyDown={on_key_down}
            placeholder="Ask about your deployment..."
            rows={1}
            className="flex-1 rounded-lg px-3 py-2 text-xs outline-none resize-none transition-colors"
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border-2)",
              color: "var(--text-1)",
              minHeight: 38,
              maxHeight: 120,
              fontFamily: "inherit",
              lineHeight: 1.55,
            }}
          />
          <button
            onClick={() => send_message(input)}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--accent)" }}
          >
            <PiPaperPlaneTiltLight size={15} color="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}
