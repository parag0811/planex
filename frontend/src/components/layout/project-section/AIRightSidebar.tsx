"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { usePathname, useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  Send,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  CheckCheck,
  AlertCircle,
  X,
} from "lucide-react";
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
  timestamp?: string;
  explanation?: string;
  suggestion?: ApplySuggestion;
  error?: string;
}

export interface ApplySuggestion {
  label?: string;
  payload: Record<string, unknown>;
  section?: string;
}

interface AISidebarProps {
  onApplySuggestion?: (suggestion: ApplySuggestion) => void;
  projectDescription?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];
const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE } as Transition,
});



const getSectionContext = (pathname: string): ChatSectionType => {
  if (pathname.includes("/idea")) return "idea";
  if (pathname.includes("/database")) return "database";
  if (pathname.includes("/api")) return "api";
  if (pathname.includes("/folder")) return "folder";
  return "none";
};

const getContextLabel = (pathname: string): string => {
  if (pathname.includes("/idea")) return "IDEATION_SECTION";
  if (pathname.includes("/database")) return "DATABASE_SECTION";
  if (pathname.includes("/api")) return "API_SECTION";
  if (pathname.includes("/folder")) return "FOLDER_SECTION";
  return "DASHBOARD";
};

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export default function AIRightSidebar({
  onApplySuggestion,
  isOpen: controlledIsOpen,
  onOpenChange,
}: AISidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = Array.isArray(params?.projectId)
    ? params.projectId[0]
    : params?.projectId || "";
  const dispatch = useDispatch<AppDispatch>();

  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const sectionContext = getSectionContext(pathname);
  const contextLabel = getContextLabel(pathname);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      timestamp: timeNow(),
      content:
        sectionContext === "none"
          ? "You're viewing the Project Dashboard. How can I assist you with this project?"
          : `You're viewing the ${
              sectionContext.charAt(0).toUpperCase() + sectionContext.slice(1)
            } section. How can I help you improve it?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  const setSidebarOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) setUncontrolledIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking || !projectId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: timeNow(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setError(null);

    try {
      const queued = await dispatch(
        sendChatMessage({
          projectId,
          message: content,
          section: sectionContext,
        }),
      ).unwrap();

      const jobId = queued.jobId;
      let jobResult = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const statusResponse = await dispatch(
            getAiJobStatusThunk({ jobId }),
          ).unwrap();
          if (
            statusResponse.status === "completed" ||
            statusResponse.status === "failed"
          ) {
            jobResult = statusResponse;
            break;
          }
        } catch (e) {
          // continue polling
        }
        attempts++;
      }

      if (jobResult) {
        if (jobResult.status === "failed") {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              timestamp: timeNow(),
              content: jobResult.error || "Request failed. Please try again.",
              error: "request_failed",
            },
          ]);
          return;
        }

        let aiResponse = jobResult.result;
        if (typeof aiResponse === "string") {
          try {
            aiResponse = JSON.parse(aiResponse);
          } catch {
            aiResponse = {
              type: "suggestion",
              message: "Failed to process response. Please try again.",
            };
          }
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          timestamp: timeNow(),
          content:
            aiResponse.type === "update"
              ? aiResponse.explanation || "Applied changes to your section."
              : aiResponse.message || "No response",
        };

        if (aiResponse.type === "update" && aiResponse.content) {
          aiMsg.explanation = aiResponse.explanation;
          aiMsg.suggestion = {
            label: `Apply ${sectionContext} changes`,
            payload: aiResponse.content,
            section: aiResponse.section || sectionContext,
          };
        }
        if (aiResponse.type === "suggestion" && !aiResponse.message) {
          aiMsg.error = "Invalid response format";
        }

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            timestamp: timeNow(),
            content: "Request timed out. Please try again.",
            error: "timeout",
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          timestamp: timeNow(),
          content:
            err?.message || "Failed to process your request. Please try again.",
          error: "request_failed",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleApply = (msg: Message) => {
    if (!msg.suggestion || !onApplySuggestion) return;
    try {
      onApplySuggestion(msg.suggestion);
      setApplied((prev) => new Set([...prev, msg.id]));
    } catch {
      setError("Failed to apply changes. Please try again.");
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-3 z-30 flex flex-col items-center gap-1 border border-[#2b2321] bg-[#2a2a2a] px-2 py-3 text-[#ff3d00] hover:bg-[#2b2321] transition-all duration-150 cursor-pointer md:right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          >
            <Sparkles size={13} strokeWidth={1.5} />
            <span
              className="text-[7px] font-bold tracking-[0.15em] uppercase leading-none whitespace-nowrap"
              style={{
                ...MONO,
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              AI Assistant
            </span>
            <PanelRightOpen size={11} strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/60 md:hidden cursor-pointer"
            aria-label="Close AI sidebar backdrop"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: EASE } as Transition}
            className="fixed bottom-0 right-0 top-14 z-20 flex w-[92vw] max-w-[360px] flex-col overflow-hidden border-l border-[#2b2321] bg-[#201f1f] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] md:w-[340px] md:max-w-none md:shrink-0 md:shadow-none"
          >
            {/* Top section — header + context */}
            <div className="shrink-0 bg-[#2a2a2a] border-b border-[#2b2321]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff3d00]" />
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                    style={MONO}
                  >
                    AI_Assistant
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/30 hover:text-white/70 transition-colors duration-150 cursor-pointer"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Current context */}
              <div className="px-4 pb-3.5">
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#ff3d00] mb-1.5"
                  style={MONO}
                >
                  Current_Context
                </p>
                <div className="border border-[#2b2321] bg-[#131313] px-3 py-2">
                  <span
                    className="text-[11px] font-bold tracking-[0.04em] text-white/80"
                    style={MONO}
                  >
                    {contextLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle scroll section */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#201f1f]">
              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={13}
                      strokeWidth={1.5}
                      className="text-red-400 shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-red-300" style={INTER}>
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <div className="px-4 py-4 flex flex-col gap-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    {...fadeUp(0)}
                    className="flex flex-col gap-2"
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <p
                            className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/30"
                            style={MONO}
                          >
                            AI_Assistant
                          </p>
                          <span
                            className="text-[9px] text-white/20"
                            style={MONO}
                          >
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={`border-l-2 pl-3 py-1 text-[13px] leading-[1.65] ${
                            msg.error
                              ? "border-red-500/50 text-white/55"
                              : "border-[#ff3d00] text-white/75"
                          }`}
                          style={INTER}
                        >
                          {msg.content}
                        </div>
                      </>
                    ) : (
                      <div
                        className="self-end max-w-[90%] border border-[#2b2321] bg-[#131313] px-3.5 py-2.5 text-[13px] leading-[1.6] text-white/70"
                        style={INTER}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Suggestion accept/deny */}
                    {msg.suggestion && !applied.has(msg.id) && (
                      <motion.div
                        {...fadeUp(0.08)}
                        className="border border-[#ff3d00]/25 bg-[#ff3d00]/[0.04] p-3"
                      >
                        {msg.explanation && (
                          <p
                            className="text-[11px] text-white/55 mb-2.5"
                            style={INTER}
                          >
                            {msg.explanation}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApply(msg)}
                            className="flex-1 border border-[#22c55e]/35 bg-[#22c55e]/10 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#22c55e] hover:bg-[#22c55e]/20 transition-all duration-150 cursor-pointer"
                            style={MONO}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              setApplied((prev) => new Set([...prev, msg.id]))
                            }
                            className="flex-1 border border-white/15 bg-white/[0.03] px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 hover:bg-white/[0.07] transition-all duration-150 cursor-pointer"
                            style={MONO}
                          >
                            Deny
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {msg.suggestion && applied.has(msg.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2.5 flex items-center gap-2"
                      >
                        <CheckCheck
                          size={12}
                          strokeWidth={1.5}
                          className="text-[#22c55e] shrink-0"
                        />
                        <span
                          className="text-[11px] text-[#22c55e] font-semibold"
                          style={INTER}
                        >
                          Applied
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 border-l-2 border-[#ff3d00]/40 pl-3 py-1"
                  >
                    <span className="text-[11px] text-white/35" style={MONO}>
                      thinking...
                    </span>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>


            </div>

            {/* Input — bottom fixed */}
            <div className="shrink-0 border-t border-[#2b2321] bg-[#131313] px-3 py-3">
              <div className="flex items-end gap-2 border border-[#2b2321] bg-[#131313] px-3 py-2.5 focus-within:border-[#ff3d00]/40 transition-colors duration-150">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Query assistant..."
                  rows={1}
                  disabled={isThinking}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-white/75 placeholder:text-white/25 leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                  style={INTER}
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking || !projectId}
                  className={`flex items-center justify-center w-7 h-7 shrink-0 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${
                    input.trim() && !isThinking && projectId
                      ? "bg-[#ff3d00] text-white hover:bg-[#ff5a26]"
                      : "bg-white/8 text-white/20"
                  }`}
                >
                  <Send size={12} strokeWidth={1.5} />
                </motion.button>
              </div>

              {/* Status bar */}
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25"
                  style={MONO}
                >
                  Ready_State
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25"
                  style={MONO}
                >
                  Planex_Copilot
                </span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
