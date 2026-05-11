"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { usePathname, useParams } from "next/navigation";
import axiosInstance from "@/src/lib/axios";
import {
  Sparkles,
  Send,
  ChevronRight,
  Bot,
  User,
  Loader2,
  CheckCheck,
  PanelRightClose,
  PanelRightOpen,
  Zap,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: EASE } as Transition,
});

const STARTER_PROMPTS = [
  "Make this field required",
  "Add more fields to this entity",
  "Suggest improvements for scalability",
  "Check for missing relationships",
];

const getSectionContext = (pathname: string): "idea" | "database" | "api" | "folder" | "none" => {
  if (pathname.includes("/idea")) return "idea";
  if (pathname.includes("/database")) return "database";
  if (pathname.includes("/api")) return "api";
  if (pathname.includes("/folder")) return "folder";
  return "none";
};

const getSectionDisplayName = (section: string): string => {
  const names: Record<string, string> = {
    idea: "IDEA SECTION",
    database: "DATABASE SECTION",
    api: "API SECTION",
    folder: "FOLDER SECTION",
    none: "PROJECT SECTION",
  };
  return names[section] || "PROJECT SECTION";
};

export default function AIRightSidebar({
  onApplySuggestion,
  projectDescription,
  isOpen: controlledIsOpen,
  onOpenChange,
}: AISidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = Array.isArray(params?.projectId) 
    ? params.projectId[0] 
    : params?.projectId || "";
  
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI Copilot. Describe what you need and I'll help you refine this section. Ask me to add fields, improve the design, or suggest best practices.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const sectionContext = getSectionContext(pathname);
  const sectionDisplayName = getSectionDisplayName(sectionContext);

  const setSidebarOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(open);
    }
    onOpenChange?.(open);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking || !projectId) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        `/projects/${projectId}/ai/chat`,
        {
          message: content,
          context: { section: sectionContext },
        },
      );

      // Poll for job result
      if (response.data?.jobId) {
        let jobResult = null;
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2 seconds = 60 seconds max

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 2000));
          
          try {
            const statusResponse = await axiosInstance.get(
              `/ai/job/${response.data.jobId}`,
            );
            
            if (
              statusResponse.data?.status === "completed" ||
              statusResponse.data?.status === "failed"
            ) {
              jobResult = statusResponse.data;
              break;
            }
          } catch (e) {
            // Continue polling
          }
          
          attempts++;
        }

        if (jobResult) {
          let aiResponse = jobResult.result;
          
          if (typeof aiResponse === "string") {
            try {
              aiResponse = JSON.parse(aiResponse);
            } catch (e) {
              console.error("Failed to parse AI response:", e);
              aiResponse = {
                type: "suggestion",
                message: "Failed to process response. Please try again.",
              };
            }
          }

          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
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
          const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Request timed out. Please try again.",
            error: "timeout",
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err?.response?.data?.message ||
          "Failed to process your request. Please try again.",
        error: "request_failed",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleApply = (msg: Message) => {
    if (!msg.suggestion || !onApplySuggestion) return;
    try {
      onApplySuggestion(msg.suggestion);
      setApplied((prev) => new Set([...prev, msg.id]));
    } catch (err) {
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
      {/* Toggle button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-3 z-30 flex h-fit w-fit flex-col items-center gap-0.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2 py-2 text-orange-500 transition-all duration-200 hover:bg-orange-500/18 md:right-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
          >
            <Sparkles size={14} />
            <span
              className="text-[7px] font-mono tracking-widest uppercase leading-none whitespace-nowrap"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              AI Copilot
            </span>
            <PanelRightOpen size={12} />
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
            className="fixed inset-0 z-10 bg-black/45 md:hidden"
            aria-label="Close AI sidebar backdrop"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.32, ease: EASE } as Transition}
            className="fixed bottom-0 right-0 top-14 z-20 flex w-[92vw] max-w-90 flex-col overflow-hidden border-l border-orange-500/15 bg-[#070a12] shadow-[-20px_0_60px_rgba(0,0,0,0.45)] md:w-85 md:max-w-none md:shrink-0 md:shadow-none"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/6 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[18px] font-bold uppercase tracking-[0.04em] text-white/90">
                    AI Copilot
                  </p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 text-white/25 transition-colors hover:bg-white/5 hover:text-white/55"
                >
                  <PanelRightClose size={15} />
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6e7688]">
                Context: {sectionDisplayName}
              </p>

              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-2.5">
                <div className="grid h-4.5 w-4.5 place-items-center rounded-xs bg-orange-500 text-[#140b01]">
                  <Zap size={10} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b8397]">
                  Planex AI
                </p>
              </div>
            </div>

            {/* Starter prompts (shown only at start) */}
            {messages.length === 1 && (
              <div className="shrink-0 border-b border-white/5 px-3 py-3">
                <p className="mb-1 px-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/22">
                  Quick prompts
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-white/6 bg-[#0d111a] px-2.5 py-2 text-left text-[13px] text-white/45 transition-all duration-200 hover:border-orange-500/30 hover:text-white/70"
                    >
                      <ChevronRight size={11} className="text-orange-500/40 shrink-0" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-4 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-300">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  {...fadeUp(0)}
                  className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {/* Avatar row */}
                  <div className={`flex items-center gap-1.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        msg.role === "assistant"
                          ? "bg-orange-500/12 border border-orange-500/22"
                          : "bg-white/[0.07] border border-white/12"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Bot size={11} className="text-orange-500" />
                      ) : (
                        <User size={11} className="text-white/50" />
                      )}
                    </div>
                    <span className="text-[9px] text-white/22 font-mono tracking-[0.08em]">
                      {msg.role === "assistant" ? "AI" : "You"}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.72] ${
                      msg.role === "user"
                        ? "rounded-tr-sm border border-orange-500/20 bg-orange-500/12 text-white/75"
                        : `rounded-tl-sm border text-white/60 ${
                            msg.error
                              ? "border-red-500/20 bg-red-500/8"
                              : "border-white/7 bg-[#121722]"
                          }`
                    }`}
                  >
                    {msg.content.split("\n").map((line, li) => (
                      <span key={li}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, pi) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={pi} className="text-white/80 font-bold">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            <span key={pi}>{part}</span>
                          ),
                        )}
                        {li < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  {/* Apply suggestion button and controls */}
                  {msg.suggestion && !applied.has(msg.id) && (
                    <motion.div
                      {...fadeUp(0.1)}
                      className="w-full max-w-[88%] rounded-md border border-orange-500/25 bg-[#140f0b] p-3"
                    >
                      {msg.explanation && (
                        <p className="text-[11px] text-white/60 mb-2.5 italic">
                          💡 {msg.explanation}
                        </p>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApply(msg)}
                          className="flex-1 rounded-sm border border-green-500/30 bg-green-500/12 px-2 py-2 text-[12px] font-bold uppercase tracking-widest text-green-400 transition-all duration-200 hover:bg-green-500/20"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => setApplied((prev) => new Set([...prev, msg.id]))}
                          className="flex-1 rounded-sm border border-white/20 bg-white/5 px-2 py-2 text-[12px] font-bold uppercase tracking-widest text-white/50 transition-all duration-200 hover:bg-white/10"
                        >
                          ✕ Deny
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {msg.suggestion && applied.has(msg.id) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full max-w-[88%] rounded-md border border-green-500/35 bg-green-500/12 px-3 py-2.5 flex items-center gap-2"
                    >
                      <CheckCheck size={12} className="text-green-400 shrink-0" />
                      <span className="text-[12px] text-green-400 font-semibold">Applied</span>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm border border-white/6 bg-[#121722] px-3.5 py-2.5"
                >
                  <Loader2 size={11} className="text-orange-500 animate-spin" />
                  <span className="text-[12px] text-white/30 font-mono tracking-[0.06em]">thinking...</span>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/5 px-3 py-3">
              <div className="flex items-end gap-2 rounded-sm border border-white/8 bg-[#0a0e18] px-3 py-2.5 transition-all duration-200 focus-within:border-orange-500/28">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask AI..."
                  rows={1}
                  disabled={isThinking}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] text-white/65 placeholder:text-white/22 leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking || !projectId}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200 ${
                    input.trim() && !isThinking && projectId
                      ? "bg-orange-500 text-[#0f0800] cursor-pointer hover:bg-orange-400"
                      : "bg-white/6 text-white/20 cursor-not-allowed"
                  }`}
                >
                  <Send size={12} />
                </motion.button>
              </div>

              <div className="mt-2 flex items-center justify-between px-0.5 text-[9px] font-mono uppercase tracking-widest text-white/18">
                <span>Model: Claude AI</span>
                <span>Enter to send</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
