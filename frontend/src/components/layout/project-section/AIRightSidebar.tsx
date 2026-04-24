"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestion?: ApplySuggestion;
}

export interface ApplySuggestion {
  label: string;
  payload: Record<string, unknown>;
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
  "Suggest a tech stack for this section",
  "What are the core features I should build?",
  "Estimate complexity and team size",
  "What are potential risks in this plan?",
];

const MOCK_RESPONSES: Record<string, { content: string; suggestion?: ApplySuggestion }> = {
  default: {
    content: "I've analyzed your project description. Here are my initial thoughts:\n\n• The scope looks well-defined for a startup-scale product\n• Consider starting with an MVP focusing on core features\n• A microservices approach may add unnecessary complexity early on\n\nWould you like me to generate full project requirements?",
  },
  tech: {
    content: "Based on your idea, here's a recommended tech stack:\n\n**Frontend:** Next.js 14, TypeScript, Tailwind CSS\n**Backend:** Node.js with Fastify, tRPC\n**Database:** PostgreSQL + Redis for caching\n**Infrastructure:** Vercel + Railway\n**AI:** OpenAI API\n\nThis stack balances developer velocity with production readiness.",
    suggestion: {
      label: "Apply Tech Stack",
      payload: {
        suggested_tech_stack: {
          frontend: ["Next.js 14", "TypeScript", "Tailwind CSS"],
          backend: ["Node.js", "Fastify", "tRPC"],
          database: ["PostgreSQL", "Redis"],
          infrastructure: ["Vercel", "Railway"],
          ai: ["OpenAI API"],
        },
      },
    },
  },
  features: {
    content: "Here are the core features I'd recommend:\n\n1. **User Authentication** — OAuth + email, critical for trust\n2. **Project Dashboard** — Central hub for all activity\n3. **Real-time Collaboration** — WebSocket-based live updates\n4. **AI Integration** — Inline suggestions and auto-completion\n5. **Export & Sharing** — PDF, markdown, and link sharing\n\nPriority order: Auth → Dashboard → Export → Collab → AI",
    suggestion: {
      label: "Apply Features",
      payload: {
        key_features: [
          { name: "User Authentication", description: "OAuth + email authentication", priority: "critical" },
          { name: "Project Dashboard", description: "Central hub for all activity", priority: "high" },
          { name: "Real-time Collaboration", description: "WebSocket-based live updates", priority: "medium" },
          { name: "AI Integration", description: "Inline suggestions and auto-completion", priority: "medium" },
          { name: "Export & Sharing", description: "PDF, markdown, and link sharing", priority: "low" },
        ],
      },
    },
  },
  complexity: {
    content: "Based on the feature set and tech choices:\n\n**Complexity:** Medium-High\n**Team Size:** 3-5 developers\n**Timeline Estimate:** 4-6 months for v1\n\n⚠️ Key risks:\n• Real-time sync adds significant backend complexity\n• AI integration requires careful rate limiting\n• Auth edge cases often underestimated\n\nRecommend splitting into 2-week sprints with clear milestones.",
    suggestion: {
      label: "Apply Complexity & Team",
      payload: {
        estimated_complexity: "medium",
        team_size: "3-5 developers",
      },
    },
  },
};

function getResponse(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("tech") || lower.includes("stack")) return MOCK_RESPONSES.tech;
  if (lower.includes("feature") || lower.includes("build")) return MOCK_RESPONSES.features;
  if (lower.includes("complex") || lower.includes("team") || lower.includes("risk")) return MOCK_RESPONSES.complexity;
  return MOCK_RESPONSES.default;
}

const getSectionContext = (pathname: string): string => {
  if (pathname.includes("/idea")) return "IDEA SECTION";
  if (pathname.includes("/database")) return "DATABASE SECTION";
  if (pathname.includes("/api")) return "API SECTION";
  if (pathname.includes("/folder")) return "FOLDER SECTION";
  return "PROJECT SECTION";
};

export default function AIRightSidebar({
  onApplySuggestion,
  projectDescription,
  isOpen: controlledIsOpen,
  onOpenChange,
}: AISidebarProps) {
  const pathname = usePathname();
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(true);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI Scout for this project. Describe your idea and I'll help you build out requirements, suggest a tech stack, estimate complexity, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sectionContext = getSectionContext(pathname);

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
    if (!content || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const response = getResponse(content);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      suggestion: response.suggestion,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);
  };

  const handleApply = (msg: Message) => {
    if (!msg.suggestion || !onApplySuggestion) return;
    onApplySuggestion(msg.suggestion);
    setApplied((prev) => new Set([...prev, msg.id]));
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
            className="fixed bottom-20 right-3 z-30 flex flex-col items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-1.5 py-2.5 text-orange-500 transition-all duration-200 hover:bg-orange-500/18 md:right-4 md:top-1/2 md:-translate-y-1/2"
          >
            <Sparkles size={14} />
            <span
              className="text-[8px] font-mono tracking-widest uppercase"
              style={{ writingMode: "vertical-rl" }}
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
                Context : {sectionContext}
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
                      {msg.role === "assistant"
                        ? <Bot size={11} className="text-orange-500" />
                        : <User size={11} className="text-white/50" />
                      }
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
                        : "rounded-tl-sm border border-white/7 bg-[#121722] text-white/60"
                    }`}
                  >
                    {msg.content.split("\n").map((line, li) => (
                      <span key={li}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, pi) =>
                          part.startsWith("**") && part.endsWith("**")
                            ? <strong key={pi} className="text-white/80 font-bold">{part.slice(2, -2)}</strong>
                            : <span key={pi}>{part}</span>
                        )}
                        {li < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  {/* Apply suggestion button */}
                  {msg.suggestion && (
                    <motion.div
                      {...fadeUp(0.1)}
                      className="w-full max-w-[88%] rounded-md border border-orange-500/25 bg-[#140f0b] p-3"
                    >
                      <p className="text-[12px] font-semibold text-white/80">Add "{msg.suggestion.label}"</p>
                      <p className="mt-0.5 text-[10px] text-white/35">Automatic monthly invoice generation.</p>

                      <motion.button
                        onClick={() => handleApply(msg)}
                        disabled={applied.has(msg.id)}
                        className={`mt-2.5 w-full rounded-sm border px-2 py-2 text-[12px] font-bold uppercase tracking-widest transition-all duration-200 ${
                          applied.has(msg.id)
                            ? "cursor-default border-green-500/35 bg-green-500/12 text-green-400"
                            : "cursor-pointer border-orange-500/30 bg-[#0c1019] text-orange-400 hover:bg-orange-500/20"
                        }`}
                      >
                        {applied.has(msg.id) ? "Applied" : "Apply Change"}
                      </motion.button>
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
                  className="flex-1 bg-transparent border-none outline-none resize-none text-[13.5px] text-white/65 placeholder:text-white/22 leading-relaxed max-h-24 overflow-y-auto"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200 ${
                    input.trim() && !isThinking
                      ? "bg-orange-500 text-[#0f0800] cursor-pointer hover:bg-orange-400"
                      : "bg-white/6 text-white/20 cursor-not-allowed"
                  }`}
                >
                  <Send size={12} />
                </motion.button>
              </div>

              <div className="mt-2 flex items-center justify-between px-0.5 text-[9px] font-mono uppercase tracking-widest text-white/18">
                <span>Model: Geist-7B</span>
                <span>Press Enter to send</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}