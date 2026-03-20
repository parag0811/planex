"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Sparkles, Send, X, ChevronRight,
  Bot, User, Loader2, CheckCheck, PanelRightClose, PanelRightOpen,
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
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: EASE } as Transition,
});

const STARTER_PROMPTS = [
  "Suggest a tech stack for my idea",
  "What are the core features I should build?",
  "Estimate complexity and team size",
  "What are potential risks?",
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

export default function AIRightSidebar({ onApplySuggestion, projectDescription }: AISidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
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
            onClick={() => setIsOpen(true)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-xl px-2 py-4 text-orange-500 cursor-pointer hover:bg-orange-500/18 transition-all duration-200"
          >
            <Sparkles size={16} />
            <span
              className="text-[9px] font-mono tracking-[0.12em] uppercase"
              style={{ writingMode: "vertical-rl" }}
            >
              AI Scout 
            </span>
            <PanelRightOpen size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE } as Transition}
            className="shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden border-l border-white/[0.06] z-20"
            style={{ background: "rgba(6,4,1,0.97)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/12 border border-orange-500/22 flex items-center justify-center">
                  <Sparkles size={13} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white/80" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em" }}>
                    AI COPILOT
                  </p>
                  <p className="text-[9px] text-orange-500/55 font-mono tracking-[0.08em]">
                    FORGE INTELLIGENCE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/25 hover:text-white/55 transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
              >
                <PanelRightClose size={15} />
              </button>
            </div>

            {/* Starter prompts (shown only at start) */}
            {messages.length === 1 && (
              <div className="px-3 py-3 border-b border-white/[0.04] flex flex-col gap-1.5 shrink-0">
                <p className="text-[9px] text-white/22 font-mono tracking-[0.14em] uppercase px-1 mb-1">
                  Quick prompts
                </p>
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="flex items-center gap-2 text-left px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-white/40 hover:text-white/65 hover:bg-white/[0.05] hover:border-orange-500/18 transition-all duration-200 cursor-pointer w-full"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <ChevronRight size={11} className="text-orange-500/40 shrink-0" />
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3 min-h-0">
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
                          : "bg-white/[0.07] border border-white/[0.12]"
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
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-[1.72] ${
                      msg.role === "user"
                        ? "bg-orange-500/[0.12] border border-orange-500/20 text-white/72 rounded-tr-sm"
                        : "bg-white/[0.04] border border-white/[0.07] text-white/58 rounded-tl-sm"
                    }`}
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
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
                    <motion.button
                      {...fadeUp(0.1)}
                      onClick={() => handleApply(msg)}
                      disabled={applied.has(msg.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-[0.06em] transition-all duration-200 border cursor-pointer ${
                        applied.has(msg.id)
                          ? "bg-green-500/10 border-green-500/25 text-green-400 cursor-default"
                          : "bg-orange-500/[0.09] border-orange-500/22 text-orange-400 hover:bg-orange-500/18 hover:border-orange-500/35"
                      }`}
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {applied.has(msg.id)
                        ? <><CheckCheck size={12} /> Applied</>
                        : <><CheckCheck size={12} /> Apply This</>
                      }
                    </motion.button>
                  )}
                </motion.div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm w-fit"
                >
                  <Loader2 size={11} className="text-orange-500 animate-spin" />
                  <span className="text-[11px] text-white/30 font-mono tracking-[0.06em]">thinking...</span>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/[0.05] shrink-0">
              <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-orange-500/28 focus-within:bg-white/[0.055] transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask AI anything about your idea..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-[12.5px] text-white/65 placeholder:text-white/22 leading-relaxed max-h-24 overflow-y-auto"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200 ${
                    input.trim() && !isThinking
                      ? "bg-orange-500 text-[#0f0800] cursor-pointer hover:bg-orange-400"
                      : "bg-white/[0.06] text-white/20 cursor-not-allowed"
                  }`}
                >
                  <Send size={12} />
                </motion.button>
              </div>
              <p className="text-[9px] text-white/15 font-mono text-center mt-2 tracking-[0.06em]">
                SHIFT+ENTER for new line · ENTER to send
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}