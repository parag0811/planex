"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Code2, Plus, X, ChevronDown, Check, Sparkles,
  Lock, Unlock, Globe, Shield, ArrowRight,
  RotateCcw, Wifi, Key, Trash2,
} from "lucide-react";
import AIRightSidebar, { type ApplySuggestion } from "@/src/components/layout/project-section/AIRightSidebar";

// Types
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRoute {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  request?: { body?: Record<string, string>; params?: Record<string, string>; query?: Record<string, string> };
  response: { success: Record<string, string> };
  authRequired: boolean;
}

interface WebSocketEvent {
  id: string;
  name: string;
  description: string;
  payload: Record<string, string>;
}

interface AuthFlow {
  type: "JWT" | "OAuth" | "Session";
  description: string;
  routes: string[];
}

interface ApiSectionContent {
  rest: ApiRoute[];
  realtime?: WebSocketEvent[];
  auth: AuthFlow;
}

// Animation
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const T = (delay = 0) => ({ duration: 0.38, delay, ease: EASE } as Transition);

const METHOD_STYLE: Record<HttpMethod, { color: string; bg: string; border: string }> = {
  GET:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)"   },
  POST:   { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)"  },
  PUT:    { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  PATCH:  { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  DELETE: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
};

const AUTH_STYLE = {
  JWT:     { color: "#f97316", Icon: Key    },
  OAuth:   { color: "#60a5fa", Icon: Globe  },
  Session: { color: "#a78bfa", Icon: Shield },
};

const uid = () => Math.random().toString(36).slice(2, 8);

// Mock data
const MOCK: ApiSectionContent = {
  rest: [
    { id: "1", name: "List Users",     method: "GET",    path: "/api/v1/users",          description: "Paginated user list",          request: { query:  { page: "number", limit: "number" } }, response: { success: { users: "User[]", total: "number" } }, authRequired: true  },
    { id: "2", name: "Register",       method: "POST",   path: "/api/v1/users/register", description: "Create a new user account",    request: { body:   { email: "string", password: "string" } }, response: { success: { user: "User", token: "string" } }, authRequired: false },
    { id: "3", name: "Get User",       method: "GET",    path: "/api/v1/users/:id",      description: "Fetch user by ID",             request: { params: { id: "string" } }, response: { success: { user: "User" } }, authRequired: true  },
    { id: "4", name: "Update User",    method: "PUT",    path: "/api/v1/users/:id",      description: "Update user profile fields",   request: { params: { id: "string" }, body: { name: "string?" } }, response: { success: { user: "User" } }, authRequired: true  },
    { id: "5", name: "Delete Project", method: "DELETE", path: "/api/v1/projects/:id",   description: "Delete project and cascade",   request: { params: { id: "string" } }, response: { success: { deleted: "boolean" } }, authRequired: true  },
  ],
  realtime: [
    { id: "w1", name: "project:update", description: "Fires on any project field change", payload: { projectId: "string", field: "string", userId: "string" } },
    { id: "w2", name: "member:join",    description: "Emitted when collaborator joins",   payload: { userId: "string", name: "string", role: "string" } },
  ],
  auth: {
    type: "JWT",
    description: "Stateless JWT with 15-min access tokens and 7-day refresh tokens. Bearer token required on all protected routes.",
    routes: ["/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout"],
  },
};

const EMPTY: ApiSectionContent = { rest: [], realtime: [], auth: { type: "JWT", description: "", routes: [] } };

// Shared: inline editable field
function EditField({ value, onChange, placeholder = "", mono = false, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; className?: string;
}) {
  const [on, setOn] = useState(false);
  const [d, setD]   = useState(value);
  const done        = () => { onChange(d); setOn(false); };

  if (on) return (
    <input
      autoFocus value={d}
      onChange={(e) => setD(e.target.value)}
      onBlur={done}
      onKeyDown={(e) => e.key === "Enter" && done()}
      className={`bg-black/30 border border-orange-500/28 rounded-lg px-2.5 py-1 text-[12px] text-white/80 outline-none ${mono ? "font-mono" : ""} ${className}`}
      style={{ fontFamily: mono ? "'Share Tech Mono',monospace" : "'Rajdhani',sans-serif" }}
    />
  );
  return (
    <span onClick={() => { setD(value); setOn(true); }} className={`cursor-pointer hover:text-white/80 transition-colors ${className}`}>
      {value || <span className="text-white/20 italic text-[11px]">{placeholder}</span>}
    </span>
  );
}

// Shared: key:value editor
function KVEditor({ data, onChange, color }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void; color: string }) {
  const [k, setK] = useState(""); const [v, setV] = useState("");
  const add = () => { if (!k.trim()) return; onChange({ ...data, [k.trim()]: v.trim() || "string" }); setK(""); setV(""); };
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="flex items-center gap-1.5 group text-[10px] font-mono">
          <span style={{ color }}>{key}</span>
          <span className="text-white/20">:</span>
          <span className="text-white/38">{val}</span>
          <button onClick={() => { const d = { ...data }; delete d[key]; onChange(d); }} className="ml-auto opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
            <X size={8} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1 mt-0.5">
        <input value={k} onChange={(e) => setK(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="key"  className="w-16 bg-transparent outline-none text-[10px] font-mono text-white/40 placeholder:text-white/14" style={{ fontFamily: "'Share Tech Mono',monospace" }} />
        <span className="text-white/15 text-[10px]">:</span>
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="type" className="w-16 bg-transparent outline-none text-[10px] font-mono text-white/30 placeholder:text-white/14" style={{ fontFamily: "'Share Tech Mono',monospace" }} />
        <button onClick={add} className="text-orange-500/35 hover:text-orange-500 transition-colors"><Plus size={9} /></button>
      </div>
    </div>
  );
}

// Route row (expandable)
function RouteRow({ route, onUpdate, onRemove }: { route: ApiRoute; onUpdate: (r: ApiRoute) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const s = METHOD_STYLE[route.method];
  const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <motion.div layout className="border border-white/[0.07] rounded-xl overflow-hidden bg-white/[0.025] hover:border-white/[0.12] transition-colors duration-200 group/r">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen((p) => !p)}>
        <select
          value={route.method}
          onChange={(e) => { e.stopPropagation(); onUpdate({ ...route, method: e.target.value as HttpMethod }); }}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-bold rounded-lg px-2 py-[3px] border outline-none appearance-none shrink-0 cursor-pointer tracking-[0.08em]"
          style={{ background: s.bg, borderColor: s.border, color: s.color, fontFamily: "'Share Tech Mono',monospace" }}
        >
          {methods.map((m) => <option key={m} value={m} style={{ background: "#0c0702", color: METHOD_STYLE[m].color }}>{m}</option>)}
        </select>

        <span className="flex-1 min-w-0 truncate font-mono" onClick={(e) => e.stopPropagation()}>
          <EditField value={route.path} onChange={(v) => onUpdate({ ...route, path: v })} placeholder="/api/v1/..." mono className="text-[12px] text-white/55" />
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onUpdate({ ...route, authRequired: !route.authRequired }); }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 transition-all ${route.authRequired ? "bg-orange-500/10 border-orange-500/22 text-orange-400" : "bg-white/[0.03] border-white/[0.07] text-white/25"}`}
        >
          {route.authRequired ? <Lock size={8} /> : <Unlock size={8} />}
          {route.authRequired ? "AUTH" : "PUBLIC"}
        </button>

        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="opacity-0 group-hover/r:opacity-100 text-white/20 hover:text-red-400 transition-all p-0.5 shrink-0">
          <Trash2 size={12} />
        </button>
        <ChevronDown size={13} className={`text-white/22 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-white/[0.05]">
            <div className="px-4 py-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[["Name", "name", route.name], ["Description", "description", route.description]].map(([label, key, val]) => (
                  <div key={key as string}>
                    <p className="text-[9px] text-white/20 font-mono tracking-[0.12em] uppercase mb-1">{label}</p>
                    <EditField value={val as string} onChange={(v) => onUpdate({ ...route, [key as string]: v })} placeholder={label + "..."} className="text-[12.5px] text-white/55" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([["params", "#a78bfa"], ["query", "#60a5fa"], ["body", "#f97316"]] as const).map(([sec, color]) => (
                  <div key={sec} className="bg-black/20 border border-white/[0.05] rounded-lg p-3">
                    <p className="text-[9px] font-mono uppercase tracking-[0.12em] mb-2" style={{ color }}>{sec}</p>
                    <KVEditor data={route.request?.[sec] ?? {}} color={color} onChange={(d) => onUpdate({ ...route, request: { ...route.request, [sec]: d } })} />
                  </div>
                ))}
              </div>

              <div className="bg-black/20 border border-white/[0.05] rounded-lg p-3">
                <p className="text-[9px] font-mono uppercase tracking-[0.12em] mb-2 text-green-400/60">Response</p>
                <KVEditor data={route.response.success} color="#22c55e" onChange={(d) => onUpdate({ ...route, response: { success: d } })} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// WS event card
function WsCard({ event, onUpdate, onRemove }: { event: WebSocketEvent; onUpdate: (e: WebSocketEvent) => void; onRemove: () => void }) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 hover:border-white/[0.12] transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi size={12} className="text-purple-400 shrink-0" />
          <EditField value={event.name} onChange={(v) => onUpdate({ ...event, name: v })} placeholder="event:name" mono className="text-[12px] font-mono text-purple-300/75" />
        </div>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
      <EditField value={event.description} onChange={(v) => onUpdate({ ...event, description: v })} placeholder="What triggers this event..." className="text-[12px] text-white/38" />
      <div className="bg-black/20 border border-white/[0.05] rounded-lg p-3">
        <p className="text-[9px] font-mono uppercase tracking-[0.12em] mb-2 text-purple-400/55">Payload</p>
        <KVEditor data={event.payload} color="#a78bfa" onChange={(d) => onUpdate({ ...event, payload: d })} />
      </div>
    </div>
  );
}

// Page
export default function ApiDesignPage() {
  const [api, setApi]       = useState<ApiSectionContent>(EMPTY);
  const [shown, setShown]   = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [tab, setTab]       = useState<"rest" | "realtime" | "auth">("rest");

  const show  = () => { setApi(MOCK); setShown(true); };
  const reset = () => { setApi(EMPTY); setShown(false); };

  const upRoute  = (id: string, r: ApiRoute)       => setApi((p) => ({ ...p, rest: p.rest.map((x) => x.id === id ? r : x) }));
  const delRoute = (id: string)                     => setApi((p) => ({ ...p, rest: p.rest.filter((x) => x.id !== id) }));
  const addRoute = ()                               => setApi((p) => ({ ...p, rest: [...p.rest, { id: uid(), name: "New Endpoint", method: "GET" as HttpMethod, path: "/api/v1/", description: "", request: {}, response: { success: {} }, authRequired: false }] }));

  const upEvent  = (id: string, e: WebSocketEvent) => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).map((x) => x.id === id ? e : x) }));
  const delEvent = (id: string)                     => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).filter((x) => x.id !== id) }));
  const addEvent = ()                               => setApi((p) => ({ ...p, realtime: [...(p.realtime ?? []), { id: uid(), name: "event:name", description: "", payload: {} }] }));

  const applyAI  = (s: ApplySuggestion)             => { setApi((p) => ({ ...p, ...s.payload })); setShown(true); };

  const authTypes: AuthFlow["type"][] = ["JWT", "OAuth", "Session"];

  return (
    <div className="flex flex-1 min-h-screen" style={{ fontFamily: "'Rajdhani',sans-serif", color: "#e0d5c5" }}>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-7 py-8 flex flex-col gap-7 max-w-4xl">

          {/* Sub-nav */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={T()} className="flex items-center justify-between pl-7 md:pl-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/18 flex items-center justify-center">
                <Code2 size={12} className="text-orange-500" />
              </div>
              <span className="text-[11px] text-white/32 font-mono tracking-[0.1em]">API DESIGN</span>
            </div>
            <div className="flex items-center gap-2">
              {shown && (
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] text-white/28 font-mono tracking-[0.06em] hover:text-white/55 transition-colors">
                  <RotateCcw size={11} /> Reset
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => setAiOpen((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-[0.06em] border transition-all duration-200 cursor-pointer ${aiOpen ? "bg-orange-500/18 border-orange-500/32 text-orange-400" : "bg-white/[0.04] border-white/[0.08] text-white/38 hover:text-orange-400 hover:border-orange-500/18"}`}
              >
                <Sparkles size={12} />
                AI Copilot
                {aiOpen && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" />}
              </motion.button>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={T(0.04)}>
            <h1
              className="font-bold leading-tight mb-2"
              style={{
                fontSize: "clamp(26px, 3.5vw, 44px)",
                background: "linear-gradient(90deg, #c2410c 0%, #f97316 50%, #fdba74 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              API Design
            </h1>
            <p className="text-[13px] text-white/28 max-w-lg leading-relaxed">
              Architect your communication layer. Define REST endpoints, WebSocket events, and auth flows.
            </p>
          </motion.div>

          {/* Show Fields button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T(0.08)}>
            {!shown ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={show}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-bold tracking-[0.08em] cursor-pointer bg-gradient-to-r from-orange-600 to-orange-400 text-[#0f0800] shadow-[0_0_24px_rgba(249,115,22,0.18)]"
              >
                <ChevronDown size={15} />
                Show API Fields
              </motion.button>
            ) : (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[11px] text-green-400/70 font-mono tracking-[0.06em]">
                <Check size={11} /> Fields visible — edit any section below
              </motion.span>
            )}
          </motion.div>

          {/* Content */}
          <AnimatePresence>
            {shown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={T(0.04)}
                className="flex flex-col gap-6"
              >
                {/* Tabs */}
                <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 w-fit flex-wrap">
                  {([
                    ["rest",     Globe, `REST (${api.rest.length})`                      ],
                    ["realtime", Wifi,  `WebSocket (${api.realtime?.length ?? 0})`       ],
                    ["auth",     Key,   "Auth Flow"                                      ],
                  ] as const).map(([id, Icon, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold tracking-[0.06em] transition-all duration-200 cursor-pointer ${tab === id ? "bg-orange-500/15 border border-orange-500/25 text-orange-400" : "text-white/28 hover:text-white/55"}`}
                    >
                      <Icon size={12} />{label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* REST */}
                  {tab === "rest" && (
                    <motion.div key="rest" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase">REST Endpoints</p>
                        <button onClick={addRoute} className="flex items-center gap-1.5 text-[11px] text-orange-500/60 hover:text-orange-500 font-mono tracking-[0.06em] transition-colors cursor-pointer">
                          <Plus size={12} /> Add Endpoint
                        </button>
                      </div>
                      {api.rest.length === 0
                        ? <div className="flex flex-col items-center py-12 gap-3 border border-dashed border-white/[0.06] rounded-xl"><Globe size={22} className="text-white/15" /><p className="text-[12px] text-white/18">No endpoints yet.</p></div>
                        : api.rest.map((r) => <RouteRow key={r.id} route={r} onUpdate={(u) => upRoute(r.id, u)} onRemove={() => delRoute(r.id)} />)
                      }
                    </motion.div>
                  )}

                  {/* WebSocket */}
                  {tab === "realtime" && (
                    <motion.div key="realtime" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase">WebSocket Events</p>
                        <button onClick={addEvent} className="flex items-center gap-1.5 text-[11px] text-orange-500/60 hover:text-orange-500 font-mono tracking-[0.06em] transition-colors cursor-pointer">
                          <Plus size={12} /> Add Event
                        </button>
                      </div>
                      {(api.realtime ?? []).length === 0
                        ? <div className="flex flex-col items-center py-12 gap-3 border border-dashed border-white/[0.06] rounded-xl"><Wifi size={22} className="text-white/15" /><p className="text-[12px] text-white/18">No WebSocket events defined.</p></div>
                        : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(api.realtime ?? []).map((e) => <WsCard key={e.id} event={e} onUpdate={(u) => upEvent(e.id, u)} onRemove={() => delEvent(e.id)} />)}</div>
                      }
                    </motion.div>
                  )}

                  {/* Auth */}
                  {tab === "auth" && (
                    <motion.div key="auth" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                      <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase">Authentication Flow</p>
                      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-5">

                        {/* Type */}
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] text-white/20 font-mono tracking-[0.14em] uppercase">Auth Type</p>
                          <div className="flex gap-2 flex-wrap">
                            {authTypes.map((t) => {
                              const { color, Icon } = AUTH_STYLE[t];
                              const active = api.auth.type === t;
                              return (
                                <button
                                  key={t}
                                  onClick={() => setApi((p) => ({ ...p, auth: { ...p.auth, type: t } }))}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold tracking-[0.06em] border transition-all duration-200 cursor-pointer"
                                  style={active ? { background: `${color}15`, borderColor: `${color}30`, color } : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)" }}
                                >
                                  <Icon size={13} />{t}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] text-white/20 font-mono tracking-[0.14em] uppercase">Description</p>
                          <div className="bg-black/20 border border-white/[0.05] rounded-xl p-3">
                            <EditField value={api.auth.description} onChange={(v) => setApi((p) => ({ ...p, auth: { ...p.auth, description: v } }))} placeholder="Describe the auth strategy..." className="text-[13px] text-white/48" />
                          </div>
                        </div>

                        {/* Protected routes */}
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] text-white/20 font-mono tracking-[0.14em] uppercase">Protected Routes</p>
                          <div className="flex flex-col gap-1.5">
                            {api.auth.routes.map((r, i) => (
                              <div key={i} className="flex items-center gap-2 group">
                                <ArrowRight size={11} className="text-orange-500/38 shrink-0" />
                                <code className="flex-1 text-[12px] font-mono text-white/52">
                                  <EditField value={r} onChange={(v) => { const routes = [...api.auth.routes]; routes[i] = v; setApi((p) => ({ ...p, auth: { ...p.auth, routes } })); }} placeholder="/api/v1/..." mono className="text-white/52" />
                                </code>
                                <button onClick={() => setApi((p) => ({ ...p, auth: { ...p.auth, routes: p.auth.routes.filter((_, j) => j !== i) } }))} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => setApi((p) => ({ ...p, auth: { ...p.auth, routes: [...p.auth.routes, "/api/v1/"] } }))} className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-orange-500 font-mono tracking-[0.06em] transition-colors mt-1 w-fit">
                              <Plus size={10} /> Add route
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty nudge */}
          {!shown && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T(0.15)} className="flex flex-col items-center text-center py-16 gap-4 border border-dashed border-white/[0.06] rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/[0.06] border border-orange-500/14 flex items-center justify-center">
                <Code2 size={24} className="text-orange-500/55" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[15px] font-bold text-white/38">No API defined yet</p>
                <p className="text-[12.5px] text-white/18 max-w-[280px] leading-relaxed">Click "Show API Fields" above or use the AI Copilot to generate your structure.</p>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* AI sidebar */}
      {aiOpen && <AIRightSidebar onApplySuggestion={applyAI} projectDescription="API Design" />}
    </div>
  );
}