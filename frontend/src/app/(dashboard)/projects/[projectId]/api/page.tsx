"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Plus,
  X,
  ChevronDown,
  Check,
  Sparkles,
  Lock,
  Globe,
  Shield,
  ArrowRight,
  RefreshCw,
  Save,
  Wifi,
  Key,
  Trash2,
  Code2,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";
import {
  fetchSectionByType,
  upsertSection,
  clearAllSectionErrors,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateApi,
  getJobStatusThunk,
  regenerateSection,
} from "@/src/store/slices/jobSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestData {
  body: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
}

interface ApiResponseData {
  success: Record<string, string>;
}

interface ApiRoute {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  request: ApiRequestData;
  response: ApiResponseData;
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

interface SectionPayload {
  content?: unknown;
}

// ─── Design tokens — identical to Idea page ──────────────────────────────────
const BG = "#141414";
const ACCENT = "#d84c28";
const BORDER = "#2b2321";
const MUTED = "#a6786d";
const INNER_BG = "#101010";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const INTER_TIGHT: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// ─── Method + Auth styles ────────────────────────────────────────────────────
const METHOD_STYLE: Record<
  HttpMethod,
  { color: string; bg: string; border: string }
> = {
  GET: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.30)" },
  POST: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.30)" },
  PUT: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.30)" },
  PATCH: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.30)" },
  DELETE: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.30)" },
};

const AUTH_STYLE = {
  JWT: { color: "#d84c28", Icon: Key },
  OAuth: { color: "#60a5fa", Icon: Globe },
  Session: { color: "#a78bfa", Icon: Shield },
};

const AUTH_TYPES: AuthFlow["type"][] = ["JWT", "OAuth", "Session"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isAuthType = (v: unknown): v is AuthFlow["type"] =>
  v === "JWT" || v === "OAuth" || v === "Session";

const emptyRecord = () => ({}) as Record<string, string>;

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [k, v]) => { if (typeof v === "string") acc[k] = v; return acc; },
    {}
  );
};

const uid = () => Math.random().toString(36).slice(2, 8);

const normalizeApi = (payload: unknown): ApiSectionContent => {
  const source =
    payload &&
      typeof payload === "object" &&
      "content" in (payload as SectionPayload) &&
      (payload as SectionPayload).content &&
      typeof (payload as SectionPayload).content === "object"
      ? (payload as SectionPayload).content
      : payload;

  const raw = (source ?? {}) as Partial<ApiSectionContent>;

  const rest = Array.isArray(raw.rest)
    ? (raw.rest.map((route) => {
      if (!route || typeof route !== "object") return null;
      const r = route as Partial<ApiRoute>;
      if (
        typeof r.name !== "string" ||
        typeof r.path !== "string" ||
        !r.method ||
        !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(r.method)
      ) return null;
      return {
        id: typeof r.id === "string" && r.id ? r.id : uid(),
        name: r.name,
        method: r.method as HttpMethod,
        path: r.path,
        description: typeof r.description === "string" ? r.description : "",
        request: {
          body: toStringRecord(r.request?.body),
          params: toStringRecord(r.request?.params),
          query: toStringRecord(r.request?.query),
        },
        response: { success: toStringRecord(r.response?.success) },
        authRequired: Boolean(r.authRequired),
      } satisfies ApiRoute;
    }).filter(Boolean) as ApiRoute[])
    : [];

  const realtime = Array.isArray(raw.realtime)
    ? (raw.realtime.map((event) => {
      if (!event || typeof event !== "object") return null;
      const e = event as Partial<WebSocketEvent>;
      if (typeof e.name !== "string") return null;
      return {
        id: typeof e.id === "string" && e.id ? e.id : uid(),
        name: e.name,
        description: typeof e.description === "string" ? e.description : "",
        payload: toStringRecord(e.payload),
      } satisfies WebSocketEvent;
    }).filter(Boolean) as WebSocketEvent[])
    : [];

  const authSource =
    raw.auth && typeof raw.auth === "object" ? (raw.auth as Partial<AuthFlow>) : {};

  return {
    rest,
    realtime,
    auth: {
      type: isAuthType(authSource.type) ? authSource.type : "JWT",
      description: typeof authSource.description === "string" ? authSource.description : "",
      routes: Array.isArray(authSource.routes)
        ? authSource.routes.filter((r): r is string => typeof r === "string")
        : [],
    },
  };
};

const createEmptyRoute = (): ApiRoute => ({
  id: uid(), name: "", method: "GET", path: "", description: "",
  request: { body: emptyRecord(), params: emptyRecord(), query: emptyRecord() },
  response: { success: emptyRecord() },
  authRequired: false,
});

const createEmptyEvent = (): WebSocketEvent => ({
  id: uid(), name: "", description: "", payload: emptyRecord(),
});

const EMPTY: ApiSectionContent = {
  rest: [], realtime: [], auth: { type: "JWT", description: "", routes: [] },
};

const hasApiContent = (api: ApiSectionContent) =>
  api.rest.length > 0 ||
  (api.realtime?.length ?? 0) > 0 ||
  Boolean(api.auth.description.trim()) ||
  api.auth.routes.length > 0 ||
  api.auth.type !== "JWT";

// ─── Inline editable field ────────────────────────────────────────────────────
function EditField({
  value, onChange, placeholder = "", mono = false, className = "",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; className?: string;
}) {
  const [on, setOn] = useState(false);
  const [d, setD] = useState(value);
  const done = () => { onChange(d); setOn(false); };

  if (on)
    return (
      <input
        autoFocus value={d}
        onChange={(e) => setD(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => e.key === "Enter" && done()}
        className={`bg-transparent border-b outline-none text-white text-[13px] pb-0.5 ${mono ? "font-mono" : ""} ${className}`}
        style={{ borderBottomColor: ACCENT, color: "#fff" }}
      />
    );
  return (
    <span
      onClick={() => { setD(value); setOn(true); }}
      className={`cursor-text transition-colors ${className}`}
      style={{ color: value ? "#fff" : "rgba(255,255,255,0.25)" }}
    >
      {value || <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic", fontSize: 11 }}>{placeholder}</span>}
    </span>
  );
}

// ─── KeyValueEditor ───────────────────────────────────────────────────────────
function KeyValueEditor({
  title, value, onChange, emptyLabel,
}: {
  title: string; value: Record<string, string>;
  onChange: (next: Record<string, string>) => void; emptyLabel: string;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");

  const addItem = () => {
    const k = keyInput.trim();
    if (!k) return;
    onChange({ ...value, [k]: valueInput.trim() || "string" });
    setKeyInput(""); setValueInput("");
  };

  return (
    <div className="border p-3" style={{ borderColor: BORDER, background: INNER_BG }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ ...MONO, color: MUTED }}>{title}</p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{emptyLabel}</p>
      </div>
      <div className="mb-3 space-y-1.5">
        {Object.entries(value).length === 0 ? (
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>No fields yet.</p>
        ) : (
          Object.entries(value).map(([k, t]) => (
            <div key={k} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border" style={{ borderColor: BORDER }}>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-mono" style={{ color: ACCENT }}>{k}</span>
                <span style={{ color: BORDER }}>:</span>
                <span className="ml-1 text-[11px] font-mono" style={{ color: MUTED }}>{t}</span>
              </div>
              <button onClick={() => { const n = { ...value }; delete n[k]; onChange(n); }} style={{ color: "rgba(255,255,255,0.25)" }}>
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        {["Field name", "Type"].map((ph, i) => (
          <input
            key={i}
            value={i === 0 ? keyInput : valueInput}
            onChange={(e) => i === 0 ? setKeyInput(e.target.value) : setValueInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={ph}
            className="px-3 py-2 font-mono text-xs outline-none border transition"
            style={{ background: BG, borderColor: BORDER, color: "#fff", ...MONO }}
          />
        ))}
        <button
          onClick={addItem}
          className="px-3 py-2 border text-xs font-bold transition hover:opacity-80"
          style={{ borderColor: ACCENT, background: `${ACCENT}12`, color: ACCENT }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Route Modal ──────────────────────────────────────────────────────────────
function RouteModal({
  route, isOpen, onClose, onSave,
}: {
  route?: ApiRoute | null; isOpen: boolean; onClose: () => void; onSave: (r: ApiRoute) => void;
}) {
  const [form, setForm] = useState<ApiRoute>(route ?? createEmptyRoute());
  useEffect(() => { if (isOpen) setForm(route ?? createEmptyRoute()); }, [isOpen, route]);
  const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.72)" }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
              style={{ background: BG, borderColor: BORDER }}>
              <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ ...MONO, color: ACCENT }}>
                    Section // 03 / API
                  </p>
                  <h2 className="text-lg font-black uppercase leading-none text-white" style={INTER_TIGHT}>
                    {route ? "Edit Endpoint" : "Add Endpoint"}
                  </h2>
                </div>
                <button onClick={onClose} className="p-1 transition hover:opacity-60" style={{ color: MUTED }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Endpoint Name</p>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Get User"
                    className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                    style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...INTER }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Method</p>
                    <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as HttpMethod })}
                      className="w-full px-3 py-3 text-sm outline-none border"
                      style={{ background: INNER_BG, borderColor: BORDER, color: "#fff", ...MONO }}>
                      {methods.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Path</p>
                    <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })}
                      placeholder="/api/v1/users"
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30 font-mono"
                      style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...MONO }} />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Description</p>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Describe what this endpoint does..."
                    className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30 resize-none"
                    style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...INTER }} />
                </div>
                <div className="grid gap-3">
                  <KeyValueEditor title="Request Body" value={form.request.body}
                    onChange={(body) => setForm({ ...form, request: { ...form.request, body } })} emptyLabel="body" />
                  <KeyValueEditor title="Request Params" value={form.request.params}
                    onChange={(params) => setForm({ ...form, request: { ...form.request, params } })} emptyLabel="params" />
                  <KeyValueEditor title="Request Query" value={form.request.query}
                    onChange={(query) => setForm({ ...form, request: { ...form.request, query } })} emptyLabel="query" />
                  <KeyValueEditor title="Response Success" value={form.response.success}
                    onChange={(success) => setForm({ ...form, response: { success } })} emptyLabel="response" />
                </div>
                <div className="flex items-center gap-3 border px-3 py-2.5" style={{ borderColor: BORDER }}>
                  <input type="checkbox" checked={form.authRequired}
                    onChange={(e) => setForm({ ...form, authRequired: e.target.checked })}
                    className="w-4 h-4" style={{ accentColor: ACCENT }} />
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)", ...INTER }}>Requires Authentication</span>
                  {form.authRequired && <Lock size={12} style={{ color: ACCENT }} />}
                </div>
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: BORDER }}>
                  <button onClick={onClose}
                    className="flex-1 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                    style={{ ...MONO, borderColor: BORDER, color: MUTED, background: "transparent" }}>Cancel</button>
                  <button onClick={() => { if (form.name.trim() && form.path.trim()) { onSave(form); onClose(); } }}
                    className="flex-1 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                    style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}>Save Endpoint</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── WsModal ──────────────────────────────────────────────────────────────────
function WsModal({
  event, isOpen, onClose, onSave,
}: {
  event?: WebSocketEvent | null; isOpen: boolean; onClose: () => void; onSave: (e: WebSocketEvent) => void;
}) {
  const [form, setForm] = useState<WebSocketEvent>(event ?? createEmptyEvent());
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState("");

  useEffect(() => {
    if (isOpen) { setForm(event ?? createEmptyEvent()); setKvKey(""); setKvValue(""); }
  }, [event, isOpen]);

  const addPayloadField = () => {
    if (kvKey.trim()) {
      setForm({ ...form, payload: { ...form.payload, [kvKey.trim()]: kvValue.trim() || "string" } });
      setKvKey(""); setKvValue("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.72)" }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
              style={{ background: BG, borderColor: BORDER }}>
              <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: BORDER }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ ...MONO, color: ACCENT }}>
                    WS // Realtime Event
                  </p>
                  <h2 className="text-lg font-black uppercase leading-none text-white" style={INTER_TIGHT}>
                    {event ? "Edit Event" : "Add Event"}
                  </h2>
                </div>
                <button onClick={onClose} className="p-1 transition hover:opacity-60" style={{ color: MUTED }}><X size={16} /></button>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Event Name</p>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., project:update"
                    className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30 font-mono"
                    style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...MONO }} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Description</p>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="What triggers this event..."
                    className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30 resize-none"
                    style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...INTER }} />
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Payload Fields</p>
                  <div className="mb-3 border p-3 space-y-1.5" style={{ borderColor: BORDER, background: INNER_BG }}>
                    {Object.entries(form.payload).length === 0 ? (
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>No fields yet.</p>
                    ) : (
                      Object.entries(form.payload).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border" style={{ borderColor: BORDER }}>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-mono" style={{ color: ACCENT }}>{k}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)" }}>: </span>
                            <span className="text-[11px] font-mono" style={{ color: MUTED }}>{v}</span>
                          </div>
                          <button onClick={() => { const p = { ...form.payload }; delete p[k]; setForm({ ...form, payload: p }); }} style={{ color: "rgba(255,255,255,0.25)" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[["Field name", kvKey, setKvKey], ["Type", kvValue, setKvValue]].map(([ph, val, set], i) => (
                      <input key={i} value={val as string} onChange={(e) => (set as any)(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addPayloadField()}
                        placeholder={ph as string}
                        className="flex-1 px-3 py-2 text-xs font-mono outline-none border transition"
                        style={{ background: BG, borderColor: BORDER, color: "#fff" }} />
                    ))}
                    <button onClick={addPayloadField} className="px-3 py-2 border transition hover:opacity-80"
                      style={{ borderColor: ACCENT, background: `${ACCENT}12`, color: ACCENT }}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: BORDER }}>
                  <button onClick={onClose}
                    className="flex-1 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                    style={{ ...MONO, borderColor: BORDER, color: MUTED, background: "transparent" }}>Cancel</button>
                  <button onClick={() => { if (form.name.trim()) { onSave(form); onClose(); } }}
                    className="flex-1 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                    style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}>Save Event</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApiDesignPage() {
  const params = useParams();
  const router = useRouter();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const resolvedProjectId = projectId && projectId !== "undefined" ? projectId : "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const jobState = useSelector((state: RootState) => state.job);
  const apiSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.api,
  );

  const [api, setApi] = useState<ApiSectionContent>(EMPTY);
  const [previewData, setPreviewData] = useState<ApiSectionContent | null>(null);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [tab, setTab] = useState<"rest" | "realtime" | "auth">("rest");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ApiRoute | null>(null);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<WebSocketEvent | null>(null);
  const [authRouteModalOpen, setAuthRouteModalOpen] = useState(false);
  const [newAuthRoute, setNewAuthRoute] = useState("");

  const isFetching = Boolean(apiSectionState?.fetch.loading);
  const isSaving = Boolean(apiSectionState?.save.loading);
  const isJobLoading = jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const sectionError = apiSectionState?.fetch.error ?? apiSectionState?.save.error ?? null;
  const error = sectionError ?? (jobState.status === "failed" ? jobState.error : null);
  const canRegenerate = Boolean(previewData) || hasGeneratedOnce || hasApiContent(api);

  const fetchApi = useCallback(async () => {
    if (!resolvedProjectId) { setApi(EMPTY); return; }
    try {
      const result = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "api" }),
      ).unwrap();
      const normalized = normalizeApi(result.section?.content ?? result.section);
      setApi(normalized);
      if (hasApiContent(normalized)) setHasGeneratedOnce(true);
    } catch {
      setApi(EMPTY);
    }
  }, [dispatch, resolvedProjectId]);

  useEffect(() => { fetchApi(); }, [fetchApi]);

  useEffect(() => {
    if (status) {
      const t = setTimeout(() => { setStatus(null); setStatusType(null); }, 3500);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleGenerate = async () => {
    if (!resolvedProjectId) { setStatus("Select a project before generating."); setStatusType("error"); return; }
    try {
      setPreviewData(null);
      dispatch(clearJobState());
      await dispatch(generateApi({ projectId: resolvedProjectId })).unwrap();
      setStatus("API generation queued. Processing now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue API generation.");
      setStatusType("error");
    }
  };

  const handleRegenerate = async () => {
    if (!resolvedProjectId) { setStatus("Select a project before regenerating."); setStatusType("error"); return; }
    try {
      setPreviewData(null);
      dispatch(clearJobState());
      await dispatch(regenerateSection({ projectId: resolvedProjectId, section: "api" })).unwrap();
      setStatus("API regeneration queued. Processing now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue API regeneration.");
      setStatusType("error");
    }
  };

  useEffect(() => {
    if (!jobState.jobId || jobState.status === "completed" || jobState.status === "failed") return;
    dispatch(getJobStatusThunk({ jobId: jobState.jobId }));
    const t = window.setInterval(() => dispatch(getJobStatusThunk({ jobId: jobState.jobId! })), 2500);
    return () => window.clearInterval(t);
  }, [dispatch, jobState.jobId, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "completed") return;
    if (jobState.result) {
      setPreviewData(normalizeApi(jobState.result));
      setHasGeneratedOnce(true);
      setStatus("Generation completed. Review and accept below.");
      setStatusType("success");
    }
    dispatch(clearJobState());
  }, [dispatch, jobState.result, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "failed") return;
    setStatus(jobState.error ?? "API generation failed.");
    setStatusType("error");
  }, [jobState.error, jobState.status]);

  const handleSave = async () => {
    if (!resolvedProjectId) { setStatus("Select a project before saving."); return; }
    if (!hasApiContent(api)) { setStatus("Add at least one API field before saving."); return; }
    try {
      const result = await dispatch(
        upsertSection({ projectId: resolvedProjectId, type: "api", content: api }),
      ).unwrap();
      setApi(normalizeApi(result.section?.content ?? result.section));
      setStatus("API section saved."); setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message || "Failed to save API section."); setStatusType("error");
    }
  };

  const handleAcceptPreview = () => {
    if (!previewData) return;
    setApi(previewData); setPreviewData(null);
    setStatus("Preview applied. Click Save to persist."); setStatusType("success");
  };
  const handleRejectPreview = () => { setPreviewData(null); setStatus(null); setStatusType(null); };

  const upRoute = (r: ApiRoute) => setApi((p) => ({ ...p, rest: p.rest.map((x) => (x.id === r.id ? r : x)) }));
  const delRoute = (id: string) => setApi((p) => ({ ...p, rest: p.rest.filter((x) => x.id !== id) }));
  const saveRoute = (r: ApiRoute) => {
    if (editingRoute) upRoute(r); else setApi((p) => ({ ...p, rest: [...p.rest, r] }));
    setRouteModalOpen(false); setEditingRoute(null);
  };
  const upEvent = (e: WebSocketEvent) => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).map((x) => (x.id === e.id ? e : x)) }));
  const delEvent = (id: string) => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).filter((x) => x.id !== id) }));
  const saveEvent = (e: WebSocketEvent) => {
    if (editingWs) upEvent(e); else setApi((p) => ({ ...p, realtime: [...(p.realtime ?? []), e] }));
    setWsModalOpen(false); setEditingWs(null);
  };

  const applyAI = (s: ApplySuggestion) => {
    setApi((p) => normalizeApi({ ...p, ...s.payload }));
    setStatus("Applied suggestion locally."); setStatusType("success");
  };

  return (
    <div
      ref={scrollRef}
      className="relative w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
        <motion.div
          className={`mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:pl-10 transition-[padding-right] duration-300 ${aiOpen ? "lg:pr-85" : "lg:pr-10"}`}
          variants={stagger}
          initial="hidden"
          animate="show"
        >

          {/* ── Top bar — Refresh / Save (matches Idea page) ── */}
          <motion.div variants={fadeUp(0)} className="mb-8 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={fetchApi}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            {canRegenerate ? (
              <button
                onClick={handleRegenerate}
                disabled={isJobLoading}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{ ...MONO, borderColor: "#60a5fa55", color: "#60a5fa", backgroundColor: "#60a5fa12" }}
              >
                <Sparkles size={12} />
                {isJobLoading ? "Regenerating..." : "Regenerate"}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isJobLoading}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{ ...MONO, borderColor: "#60a5fa55", color: "#60a5fa", backgroundColor: "#60a5fa12" }}
              >
                <Sparkles size={12} />
                {isJobLoading ? "Generating..." : "Generate"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
              style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
            >
              <Save size={12} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </motion.div>

          {/* ── Loading bar (matches Idea page) ── */}
          {loading && (
            <div
              className="mb-6 flex items-center gap-2.5 border px-4 py-2.5"
              style={{ borderColor: `${ACCENT}30`, backgroundColor: `${ACCENT}10` }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-t-transparent"
                style={{ borderColor: ACCENT, borderTopColor: "transparent" }}
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ ...MONO, color: ACCENT }}>
                {isJobLoading ? "Generating API section" : isSaving ? "Saving API section" : "Loading API section"}
              </p>
            </div>
          )}

          {/* ── Error (matches Idea page) ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                className="mb-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-md" />
                <div 
                  className="relative border p-4 flex items-start gap-4"
                  style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
                >
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-1"
                      style={MONO}
                    >
                      Error Detected
                    </p>
                    <p className="text-sm text-red-200/90 leading-relaxed" style={INTER}>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(clearAllSectionErrors());
                      dispatch(clearJobState());
                    }}
                    className="shrink-0 p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-500/30"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Status (matches Idea page) ── */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.25 }}
                className="mb-6 flex items-center gap-3 border px-4 py-3"
                style={{
                  borderColor: statusType === "success" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                  backgroundColor: statusType === "success" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                }}
              >
                {statusType === "success"
                  ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  : <Zap size={16} className="text-amber-500 shrink-0" />}
                <p className="text-sm font-medium" style={{ ...INTER, color: statusType === "success" ? "#34d399" : "#fbbf24" }}>
                  {status}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Breadcrumb (matches Idea page exactly) ── */}
          <motion.div variants={fadeUp(1)} className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ ...MONO, color: ACCENT }}>
              Section // 03 / API Design
            </p>
          </motion.div>

          {/* ── Giant headline (matches Idea page) ── */}
          <motion.div variants={fadeUp(2)} className="mb-6">
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              API Design
            </h1>
          </motion.div>

          {/* ── Tag pills (matches Idea page) ── */}
          <motion.div variants={fadeUp(3)} className="mb-10 flex flex-wrap items-center gap-3">

            <span
              className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              {api.rest.length > 0 ? `${api.rest.length}_Endpoints_Defined` : "No_Endpoints_Yet"}
            </span>
            <span
              className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              Auth: {api.auth.type}
            </span>
          </motion.div>

          {/* ── Section divider (matches Idea page) ── */}
          <motion.div variants={fadeUp(4)} className="mb-8 flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ ...MONO, color: MUTED }}>
              Endpoints & Auth
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          </motion.div>

          {/* ── Tabs ── */}
          <motion.div variants={fadeUp(5)} className="mb-6">
            <div className="flex gap-0 border" style={{ borderColor: BORDER, width: "fit-content" }}>
              {([
                ["rest", Globe, `REST  (${api.rest.length})`],
                ["realtime", Wifi, `WS Events  (${api.realtime?.length ?? 0})`],
                ["auth", Key, "Auth Flow"],
              ] as const).map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold tracking-[0.14em] transition-all duration-150 border-r last:border-r-0"
                  style={{
                    ...MONO,
                    borderColor: BORDER,
                    background: tab === id ? `${ACCENT}12` : "transparent",
                    color: tab === id ? ACCENT : MUTED,
                    borderBottomColor: tab === id ? ACCENT : "transparent",
                    borderBottomWidth: 2,
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Tab content ── */}
          <motion.div variants={fadeUp(6)}>
            <AnimatePresence mode="wait">

              {/* REST */}
              {tab === "rest" && (
                <motion.div key="rest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ ...MONO, color: MUTED }}>Active Routes</span>
                    <button
                      onClick={() => { setEditingRoute(null); setRouteModalOpen(true); }}
                      className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                      style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
                    >
                      <Plus size={13} />
                      Add Endpoint
                    </button>
                  </div>

                  {api.rest.length === 0 ? (
                    <div className="border p-8 text-center" style={{ borderColor: BORDER, backgroundColor: INNER_BG }}>
                      <p className="text-base" style={{ ...INTER, color: MUTED }}>
                        No endpoints yet. Click "Add Endpoint" or use Generate to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="border" style={{ borderColor: BORDER }}>
                      {api.rest.map((r, i) => {
                        const s = METHOD_STYLE[r.method];
                        return (
                          <motion.div
                            key={r.id} layout
                            className="flex items-center gap-3 px-4 py-3 group transition-colors"
                            style={{ borderBottom: i < api.rest.length - 1 ? `1px solid ${BORDER}` : undefined, background: "transparent" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = INNER_BG)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span
                              className="shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] border min-w-[46px] text-center"
                              style={{ ...MONO, background: s.bg, borderColor: s.border, color: s.color }}
                            >{r.method}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-mono truncate text-white">{r.path}</p>
                              {r.description && <p className="text-[11px] truncate mt-0.5" style={{ color: MUTED }}>{r.description}</p>}
                            </div>
                            {r.authRequired && (
                              <div className="flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] shrink-0"
                                style={{ ...MONO, borderColor: `${ACCENT}40`, background: `${ACCENT}12`, color: ACCENT }}>
                                <Lock size={9} />AUTH
                              </div>
                            )}
                            <div className="flex items-center gap-2 transition-opacity">
                              <button onClick={() => { setEditingRoute(r); setRouteModalOpen(true); }}
                                className="p-1.5 border transition hover:opacity-70" style={{ borderColor: BORDER, color: MUTED }}>
                                <ChevronDown size={18} className="-rotate-90" />
                              </button>
                              <button onClick={() => delRoute(r.id)}
                                className="p-1.5 border transition hover:opacity-70"
                                style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.6)" }}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* WS Events */}
              {tab === "realtime" && (
                <motion.div key="realtime" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ ...MONO, color: MUTED }}>WebSocket Events</span>
                    <button
                      onClick={() => { setEditingWs(null); setWsModalOpen(true); }}
                      className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                      style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
                    >
                      <Plus size={13} />Add Event
                    </button>
                  </div>

                  {(api.realtime ?? []).length === 0 ? (
                    <div className="border p-8 text-center" style={{ borderColor: BORDER, backgroundColor: INNER_BG }}>
                      <p className="text-base" style={{ ...INTER, color: MUTED }}>No WebSocket events defined yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(api.realtime ?? []).map((e) => (
                        <motion.div key={e.id} layout
                          className="group border p-5 transition-colors"
                          style={{ borderColor: BORDER, background: INNER_BG }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = `${ACCENT}40`)}
                          onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = BORDER)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[13px] truncate" style={{ color: ACCENT }}>{e.name}</p>
                              <p className="mt-1 text-[11px] line-clamp-2" style={{ color: MUTED }}>{e.description}</p>
                            </div>
                            <div className="flex gap-2 shrink-0 transition-opacity">
                              <button onClick={() => { setEditingWs(e); setWsModalOpen(true); }}
                                className="p-1.5 border" style={{ borderColor: BORDER, color: MUTED }}>
                                <ChevronDown size={18} className="-rotate-90" />
                              </button>
                              <button onClick={() => delEvent(e.id)} className="p-1.5 border hover:opacity-70"
                                style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.6)" }}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          {Object.entries(e.payload).length > 0 && (
                            <div className="border p-3" style={{ borderColor: BORDER, background: BG }}>
                              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ ...MONO, color: MUTED }}>Payload</p>
                              <div className="space-y-1">
                                {Object.entries(e.payload).slice(0, 3).map(([k, v]) => (
                                  <div key={k} className="text-[10px]" style={MONO}>
                                    <span style={{ color: ACCENT }}>{k}</span>
                                    <span style={{ color: BORDER }}>: </span>
                                    <span style={{ color: MUTED }}>{v}</span>
                                  </div>
                                ))}
                                {Object.entries(e.payload).length > 3 && (
                                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    +{Object.entries(e.payload).length - 3} more fields
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Auth Flow */}
              {tab === "auth" && (
                <motion.div key="auth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ ...MONO, color: MUTED }}>Authentication Strategy</span>
                    <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
                  </div>

                  <div className="border p-5" style={{ borderColor: ACCENT, background: INNER_BG }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock size={12} style={{ color: ACCENT }} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ ...MONO, color: ACCENT }}>Auth Flow Config</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {AUTH_TYPES.map((t) => {
                        const { color, Icon } = AUTH_STYLE[t];
                        const active = api.auth.type === t;
                        return (
                          <button key={t}
                            onClick={() => setApi((p) => ({ ...p, auth: { ...p.auth, type: t } }))}
                            className="flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] transition-all"
                            style={{ ...MONO, background: active ? `${color}18` : "transparent", borderColor: active ? color : BORDER, color: active ? color : MUTED }}
                          >
                            <Icon size={11} />{t}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border p-4" style={{ borderColor: BORDER, background: BG }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ ...MONO, color: MUTED }}>Description</p>
                      <EditField
                        value={api.auth.description}
                        onChange={(v) => setApi((p) => ({ ...p, auth: { ...p.auth, description: v } }))}
                        placeholder="Describe the auth strategy…"
                        className="text-[13px] leading-relaxed w-full"
                      />
                    </div>
                  </div>

                  <div className="border p-5" style={{ borderColor: BORDER, background: INNER_BG }}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0" style={{ ...MONO, color: MUTED }}>Protected Routes</span>
                      <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {api.auth.routes.length === 0 ? (
                        <p className="text-sm py-2" style={{ ...INTER, color: MUTED }}>No routes added yet.</p>
                      ) : (
                        api.auth.routes.map((r, i) => (
                          <div key={i} className="group flex items-center gap-2 border px-3 py-2" style={{ borderColor: BORDER }}>
                            <ArrowRight size={10} style={{ color: ACCENT }} className="shrink-0" />
                            <code className="flex-1 text-[12px] font-mono" style={{ ...MONO, color: "rgba(255,255,255,0.55)" }}>
                              <EditField value={r}
                                onChange={(v) => { const routes = [...api.auth.routes]; routes[i] = v; setApi((p) => ({ ...p, auth: { ...p.auth, routes } })); }}
                                placeholder="/api/v1/…" mono className="text-[12px]" />
                            </code>
                            <button
                              onClick={() => setApi((p) => ({ ...p, auth: { ...p.auth, routes: p.auth.routes.filter((_, j) => j !== i) } }))}
                              className="p-1 transition hover:opacity-70" style={{ color: MUTED }}>
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => { setNewAuthRoute(""); setAuthRouteModalOpen(true); }}
                      className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                      style={{ ...MONO, borderColor: BORDER, color: MUTED, background: "transparent" }}
                    >
                      <Plus size={13} />Add Route
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </motion.div>
      </div>

      {/* ── Add Auth Route Modal ── */}
      <AnimatePresence>
        {authRouteModalOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAuthRouteModalOpen(false)} className="fixed inset-0 z-40 bg-black/60" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.22, ease: EASE }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 border p-6" style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-lg font-bold uppercase tracking-[0.06em] text-white" style={INTER_TIGHT}>Add Auth Route</p>
                <button onClick={() => setAuthRouteModalOpen(false)} className="p-1 transition hover:text-white" style={{ color: MUTED }}><X size={16} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newAuthRoute.trim()) {
                  setApi((p) => ({ ...p, auth: { ...p.auth, routes: [...p.auth.routes, newAuthRoute.trim()] } }));
                  setAuthRouteModalOpen(false);
                }
              }} className="space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Route Path</p>
                  <input value={newAuthRoute} onChange={(e) => setNewAuthRoute(e.target.value)} placeholder="e.g. /api/v1/admin/*" className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30 font-mono" style={{ borderColor: BORDER, backgroundColor: INNER_BG }} autoFocus />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setAuthRouteModalOpen(false)} className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:text-white cursor-pointer" style={{ ...MONO, borderColor: BORDER, color: MUTED }}>Cancel</button>
                  <button type="submit" className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:opacity-80 cursor-pointer" style={{ ...MONO, borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}>Add Route</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Preview modal ── */}
      <AnimatePresence>
        {previewData && (
          <>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleRejectPreview}
              className="fixed inset-0 z-40 bg-black/60" aria-label="Close preview" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.22, ease: EASE }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6 no-scrollbar"
              style={{ borderColor: ACCENT, backgroundColor: BG, ...INTER }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ ...MONO, color: ACCENT }}>Section // 03 / Preview</p>
                  <p className="text-lg font-black uppercase leading-none text-white" style={INTER_TIGHT}>Generated API</p>
                </div>
                <button onClick={handleRejectPreview} className="p-1 transition hover:text-white" style={{ color: MUTED }}><X size={16} /></button>
              </div>

              <div className="space-y-6">
                {previewData.rest.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>REST Endpoints</p>
                    <div className="border" style={{ borderColor: BORDER }}>
                      {previewData.rest.map((route, i) => {
                        const s = METHOD_STYLE[route.method];
                        return (
                          <div key={route.id} className="flex flex-wrap items-center gap-3 px-4 py-3"
                            style={{ borderBottom: i < previewData.rest.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                            <span className="px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] border min-w-[46px] text-center"
                              style={{ ...MONO, background: s.bg, borderColor: s.border, color: s.color }}>{route.method}</span>
                            <span className="font-mono text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{route.path}</span>
                            {route.authRequired && (
                              <span className="border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                                style={{ ...MONO, borderColor: `${ACCENT}40`, background: `${ACCENT}12`, color: ACCENT }}>Auth</span>
                            )}
                            <span className="text-[12px] ml-auto" style={{ color: MUTED }}>{route.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(previewData.realtime ?? []).length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>WebSocket Events</p>
                    <div className="space-y-2">
                      {(previewData.realtime ?? []).map((ev) => (
                        <div key={ev.id} className="border p-3" style={{ borderColor: BORDER, backgroundColor: INNER_BG }}>
                          <p className="text-[13px] font-mono" style={{ color: ACCENT }}>{ev.name}</p>
                          <p className="mt-1 text-[11px]" style={{ color: MUTED }}>{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>Auth Flow</p>
                  <div className="border p-4" style={{ borderColor: BORDER, backgroundColor: INNER_BG }}>
                    <span className="border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...MONO, borderColor: `${ACCENT}40`, background: `${ACCENT}12`, color: ACCENT }}>
                      {previewData.auth.type}
                    </span>
                    <p className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {previewData.auth.description || "No auth description provided."}
                    </p>
                    {previewData.auth.routes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previewData.auth.routes.map((r) => (
                          <span key={r} className="border px-2 py-1 font-mono text-[11px]"
                            style={{ ...MONO, borderColor: BORDER, background: BG, color: MUTED }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t pt-6" style={{ borderColor: BORDER }}>
                <button onClick={handleRegenerate} disabled={isJobLoading}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50"
                  style={{ ...MONO, borderColor: "#60a5fa55", color: "#60a5fa", backgroundColor: "#60a5fa12" }}>
                  Regenerate
                </button>
                <button onClick={handleRejectPreview}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{ ...MONO, borderColor: BORDER, color: MUTED }}>Reject</button>
                <button onClick={handleAcceptPreview}
                  className="flex items-center gap-2 border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{ ...MONO, borderColor: "#22c55e55", color: "#22c55e", backgroundColor: "#22c55e12" }}>
                  <Check size={15} />Accept & Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AIRightSidebar
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
        onApplySuggestion={applyAI}
        projectDescription="Design your API endpoints, WebSocket events, and authentication flow."
      />

      <RouteModal
        route={editingRoute} isOpen={routeModalOpen}
        onClose={() => { setRouteModalOpen(false); setEditingRoute(null); }}
        onSave={saveRoute}
      />
      <WsModal
        event={editingWs} isOpen={wsModalOpen}
        onClose={() => { setWsModalOpen(false); setEditingWs(null); }}
        onSave={saveEvent}
      />
    </div>
  );
}