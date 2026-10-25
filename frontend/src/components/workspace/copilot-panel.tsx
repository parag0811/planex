"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Send, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import { WORKSPACE_STAGES } from "@/src/lib/stages";
import {
  getAiJobStatusThunk,
  sendChatMessage,
  type ChatSectionType,
} from "@/src/store/slices/jobSlice";
import { fetchProjectById } from "@/src/store/slices/projectSlice";
import { upsertSection } from "@/src/store/slices/sectionSlice";
import type { AppDispatch } from "@/src/store/store";

type ApplySection = Exclude<ChatSectionType, "none">;

interface Suggestion {
  section: ApplySection;
  payload: unknown;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestion?: Suggestion;
  error?: boolean;
}

const SECTION_LABEL = (section: ChatSectionType) =>
  WORKSPACE_STAGES.find((stage) => stage.id === section)?.label ?? "Workspace";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  h1: ({ children }) => (
    <h1 className="mb-1 mt-3 text-[13px] font-semibold text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-3 text-[13px] font-semibold text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3 text-[12px] font-semibold text-ink first:mt-0">
      {children}
    </h3>
  ),
  code: ({ className, children }) => (
    <code
      className={cn(
        "font-mono text-[11px]",
        className
          ? "text-ink-soft"
          : "rounded bg-surface-muted px-1 py-0.5 text-ink",
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-brand/30 pl-3 italic text-ink-muted">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-2 py-1 text-left font-semibold text-ink">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line px-2 py-1 text-ink-soft">
      {children}
    </td>
  ),
};

export function CopilotPanel({
  projectId,
  section,
}: {
  projectId: string;
  section: ChatSectionType;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const label = SECTION_LABEL(section);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `You're working on ${label.toLowerCase()}. What should we refine?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
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
    setActionError(null);

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
        section?: string;
        content?: unknown;
      };

      const isUpdate = result.type === "update";
      const resultSection =
        result.section === "idea" ||
        result.section === "database" ||
        result.section === "api" ||
        result.section === "folder"
          ? (result.section as ApplySection)
          : section !== "none"
            ? section
            : null;

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: isUpdate
            ? result.explanation || "Here is a suggested revision."
            : result.message || "No response.",
          ...(isUpdate && resultSection
            ? {
                suggestion: {
                  section: resultSection,
                  payload: result.content,
                },
              }
            : {}),
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

  const applySuggestion = async (message: Message) => {
    if (!message.suggestion || applying) return;

    setApplying(message.id);
    setActionError(null);

    try {
      await dispatch(
        upsertSection({
          projectId,
          type: message.suggestion.section,
          content: message.suggestion.payload,
        }),
      ).unwrap();

      dispatch(fetchProjectById(projectId));
      window.dispatchEvent(
        new CustomEvent("planex:section-updated", {
          detail: {
            projectId,
            section: message.suggestion.section,
          },
        }),
      );

      setApplied((prev) => new Set(prev).add(message.id));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not apply the suggestion.",
      );
    } finally {
      setApplying(null);
    }
  };

  const dismissSuggestion = (messageId: string) => {
    setDismissed((prev) => new Set(prev).add(messageId));
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
                message.role === "assistant" ? "text-brand" : "text-ink-muted",
              )}
            >
              {message.role === "assistant" ? "Planex Copilot" : "You"}
            </p>

            {message.role === "assistant" ? (
              <div
                className={cn(
                  "text-[13px] leading-relaxed",
                  message.error ? "text-danger" : "text-ink-soft",
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                {message.content}
              </p>
            )}

            {message.suggestion &&
            !applied.has(message.id) &&
            !dismissed.has(message.id) ? (
              <div className="rounded-lg border border-line bg-canvas p-3">
                <Badge tone="neutral">Suggestion only · Not saved</Badge>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
                  Applying writes this to the saved blueprint. You can edit it
                  afterwards.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={applying === message.id}
                    onClick={() => void applySuggestion(message)}
                  >
                    Apply to{" "}
                    {SECTION_LABEL(message.suggestion.section).toLowerCase()}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissSuggestion(message.id)}
                  >
                    Not now
                  </Button>
                </div>
              </div>
            ) : null}

            {message.suggestion && applied.has(message.id) ? (
              <Badge tone="brand">Applied to saved blueprint</Badge>
            ) : null}
          </div>
        ))}

        {thinking ? (
          <p className="text-[11px] text-ink-muted">Thinking…</p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-line p-4">
        {actionError ? (
          <p className="mb-2 text-[11px] text-danger" role="alert">
            {actionError}
          </p>
        ) : null}

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
          Suggestions never change your saved blueprint until you apply them.
        </p>
      </div>
    </div>
  );
}
