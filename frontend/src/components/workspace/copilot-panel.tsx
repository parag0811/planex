"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Send, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/cn";
import { WORKSPACE_STAGES } from "@/src/lib/stages";
import {
  getAiJobStatusThunk,
  sendChatMessage,
  type ChatSectionType,
} from "@/src/store/slices/jobSlice";
import type { AppDispatch } from "@/src/store/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestion?: boolean;
  error?: boolean;
}

const sectionLabel = (section: ChatSectionType) =>
  WORKSPACE_STAGES.find((stage) => stage.id === section)?.label ?? "Workspace";

export function CopilotPanel({
  projectId,
  section,
}: {
  projectId: string;
  section: ChatSectionType;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const label = sectionLabel(section);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `You're working on ${label.toLowerCase()}. What should we refine?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: "user", content },
    ]);
    setInput("");
    setThinking(true);

    try {
      const queued = await dispatch(
        sendChatMessage({ projectId, message: content, section }),
      ).unwrap();

      const jobId = queued.jobId;
      let completed: {
        status: string;
        result?: unknown;
        error?: string | null;
      } | null = null;

      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await dispatch(getAiJobStatusThunk({ jobId })).unwrap();
        if (status.status === "completed" || status.status === "failed") {
          completed = status;
          break;
        }
      }

      if (!completed) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-timeout`,
            role: "assistant",
            content: "That took too long. Please try again.",
            error: true,
          },
        ]);
        return;
      }

      if (completed.status === "failed") {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-error`,
            role: "assistant",
            content: completed.error || "The copilot could not respond.",
            error: true,
          },
        ]);
        return;
      }

      let parsed: unknown = completed.result;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = { type: "suggestion", message: parsed };
        }
      }

      const result = (
        parsed && typeof parsed === "object" ? parsed : {}
      ) as {
        type?: string;
        explanation?: string;
        message?: string;
      };

      const isUpdate = result.type === "update";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: isUpdate
            ? result.explanation || "Here is a suggested revision."
            : result?.message || "No response.",
          suggestion: isUpdate,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-failed`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The copilot could not respond.",
          error: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-5">
        <Sparkles size={16} className="text-brand" strokeWidth={1.6} />
        <p className="text-[14px] font-semibold text-ink">AI Copilot</p>
      </div>

      <div className="shrink-0 border-b border-line px-5 py-3">
        <p className="font-mono text-[10px] text-ink-muted">WORKING ON</p>
        <p className="mt-1 text-[12px] text-ink-soft">
          {label} · Draft v1
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-1.5">
            <p
              className={cn(
                "text-[11px]",
                message.role === "assistant"
                  ? "text-brand"
                  : "text-ink-muted",
              )}
            >
              {message.role === "assistant" ? "Planex Copilot" : "You"}
            </p>
            <p
              className={cn(
                "whitespace-pre-wrap text-[13px] leading-relaxed",
                message.error
                  ? "text-danger"
                  : message.role === "assistant"
                    ? "text-ink-soft"
                    : "text-ink",
              )}
            >
              {message.content}
            </p>
            {message.suggestion ? (
              <Badge tone="neutral">Suggestion only · Not saved</Badge>
            ) : null}
          </div>
        ))}

        {thinking ? (
          <p className="text-[11px] text-ink-muted">Thinking…</p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-line p-4">
        <p className="mb-2 font-mono text-[10px] text-ink-muted">
          KEEP EXPLORING
        </p>
        <button
          type="button"
          onClick={() => {
            setInput("What should we leave out of the first version?");
          }}
          className="mb-3 w-full rounded-lg bg-surface-muted px-3 py-2 text-left text-[12px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
        >
          What should we leave out of the first version?
        </button>

        <div className="rounded-lg border border-line bg-surface p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder={`Ask about your ${label.toLowerCase()}…`}
            className="w-full resize-none bg-transparent text-[12px] leading-relaxed text-ink outline-none placeholder:text-ink-muted"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-ink-muted">
              ↵ Send · ⇧↵ New line
            </span>
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim() || thinking}
              aria-label="Send message"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-ink-muted">
          Suggestions never change your saved blueprint.
        </p>
      </div>
    </div>
  );
}
