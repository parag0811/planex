"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Code2,
  Plus,
  X,
  ChevronDown,
  Check,
  Sparkles,
  Lock,
  Globe,
  Shield,
  ArrowRight,
  RotateCcw,
  Wifi,
  Key,
  Trash2,
} from "lucide-react";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";
import {
  fetchSectionByType,
  upsertSection,
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#141414",
  inner: "#101010",
  border: "#2b2321",
  accent: "#d84c28",
  accentDim: "rgba(216,76,40,0.12)",
  accentMid: "rgba(216,76,40,0.25)",
  label: "#a6786d",
  white: "#ffffff",
  whiteDim: "rgba(255,255,255,0.55)",
  whiteFaint: "rgba(255,255,255,0.25)",
};

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const METHOD_STYLE: Record<
  HttpMethod,
  { color: string; bg: string; border: string }
> = {
  GET: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.30)",
  },
  POST: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.30)",
  },
  PUT: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.30)",
  },
  PATCH: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.30)",
  },
  DELETE: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.30)",
  },
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
  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, string>
  >((acc, [k, v]) => {
    if (typeof v === "string") acc[k] = v;
    return acc;
  }, {});
};

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
    ? (raw.rest
        .map((route) => {
          if (!route || typeof route !== "object") return null;
          const r = route as Partial<ApiRoute>;
          if (
            typeof r.name !== "string" ||
            typeof r.path !== "string" ||
            !r.method ||
            !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(r.method)
          )
            return null;
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
        })
        .filter(Boolean) as ApiRoute[])
    : [];

  const realtime = Array.isArray(raw.realtime)
    ? (raw.realtime
        .map((event) => {
          if (!event || typeof event !== "object") return null;
          const e = event as Partial<WebSocketEvent>;
          if (typeof e.name !== "string") return null;
          return {
            id: typeof e.id === "string" && e.id ? e.id : uid(),
            name: e.name,
            description: typeof e.description === "string" ? e.description : "",
            payload: toStringRecord(e.payload),
          } satisfies WebSocketEvent;
        })
        .filter(Boolean) as WebSocketEvent[])
    : [];

  const authSource =
    raw.auth && typeof raw.auth === "object"
      ? (raw.auth as Partial<AuthFlow>)
      : {};
  return {
    rest,
    realtime,
    auth: {
      type: isAuthType(authSource.type) ? authSource.type : "JWT",
      description:
        typeof authSource.description === "string"
          ? authSource.description
          : "",
      routes: Array.isArray(authSource.routes)
        ? authSource.routes.filter((r): r is string => typeof r === "string")
        : [],
    },
  };
};

const uid = () => Math.random().toString(36).slice(2, 8);

const createEmptyRoute = (): ApiRoute => ({
  id: uid(),
  name: "",
  method: "GET",
  path: "",
  description: "",
  request: { body: emptyRecord(), params: emptyRecord(), query: emptyRecord() },
  response: { success: emptyRecord() },
  authRequired: false,
});

const createEmptyEvent = (): WebSocketEvent => ({
  id: uid(),
  name: "",
  description: "",
  payload: emptyRecord(),
});

const MOCK: ApiSectionContent = {
  rest: [
    {
      id: "1",
      name: "List Users",
      method: "GET",
      path: "/api/v1/users",
      description: "Paginated user list",
      request: {
        body: {},
        params: {},
        query: { page: "number", limit: "number" },
      },
      response: { success: { users: "User[]", total: "number" } },
      authRequired: true,
    },
    {
      id: "2",
      name: "Register",
      method: "POST",
      path: "/api/v1/users/register",
      description: "Create a new user account",
      request: {
        body: { email: "string", password: "string" },
        params: {},
        query: {},
      },
      response: { success: { user: "User", token: "string" } },
      authRequired: false,
    },
    {
      id: "3",
      name: "Get User",
      method: "GET",
      path: "/api/v1/users/:id",
      description: "Fetch user by ID",
      request: { body: {}, params: { id: "string" }, query: {} },
      response: { success: { user: "User" } },
      authRequired: true,
    },
    {
      id: "4",
      name: "Update User",
      method: "PUT",
      path: "/api/v1/users/:id",
      description: "Update user profile fields",
      request: {
        body: { name: "string?" },
        params: { id: "string" },
        query: {},
      },
      response: { success: { user: "User" } },
      authRequired: true,
    },
    {
      id: "5",
      name: "Delete Project",
      method: "DELETE",
      path: "/api/v1/projects/:id",
      description: "Delete project and cascade",
      request: { body: {}, params: { id: "string" }, query: {} },
      response: { success: { deleted: "boolean" } },
      authRequired: true,
    },
  ],
  realtime: [
    {
      id: "w1",
      name: "project:update",
      description: "Fires on any project field change",
      payload: { projectId: "string", field: "string", userId: "string" },
    },
    {
      id: "w2",
      name: "member:join",
      description: "Emitted when collaborator joins",
      payload: { userId: "string", name: "string", role: "string" },
    },
  ],
  auth: {
    type: "JWT",
    description:
      "Stateless JWT with 15-min access tokens and 7-day refresh tokens. Bearer token required on all protected routes.",
    routes: [
      "/api/v1/auth/login",
      "/api/v1/auth/refresh",
      "/api/v1/auth/logout",
    ],
  },
};

const EMPTY: ApiSectionContent = {
  rest: [],
  realtime: [],
  auth: { type: "JWT", description: "", routes: [] },
};

const hasApiContent = (api: ApiSectionContent) =>
  api.rest.length > 0 ||
  (api.realtime?.length ?? 0) > 0 ||
  Boolean(api.auth.description.trim()) ||
  api.auth.routes.length > 0 ||
  api.auth.type !== "JWT";

// ─── Shared: inline editable field ───────────────────────────────────────────
function EditField({
  value,
  onChange,
  placeholder = "",
  mono = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(false);
  const [d, setD] = useState(value);
  const done = () => {
    onChange(d);
    setOn(false);
  };

  if (on)
    return (
      <input
        autoFocus
        value={d}
        onChange={(e) => setD(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => e.key === "Enter" && done()}
        className={`bg-transparent border-b outline-none text-white text-[13px] pb-0.5 ${mono ? "font-mono" : ""} ${className}`}
        style={{
          borderBottomColor: C.accent,
          fontFamily: mono ? "'Share Tech Mono',monospace" : "inherit",
          color: C.white,
        }}
      />
    );
  return (
    <span
      onClick={() => {
        setD(value);
        setOn(true);
      }}
      className={`cursor-text transition-colors ${className}`}
      style={{ color: value ? C.white : C.whiteFaint }}
    >
      {value || (
        <span
          style={{ color: C.whiteFaint, fontStyle: "italic", fontSize: 11 }}
        >
          {placeholder}
        </span>
      )}
    </span>
  );
}

// ─── KeyValueEditor ───────────────────────────────────────────────────────────
function KeyValueEditor({
  title,
  value,
  onChange,
  emptyLabel,
}: {
  title: string;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  emptyLabel: string;
}) {
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");

  const addItem = () => {
    const k = keyInput.trim();
    if (!k) return;
    onChange({ ...value, [k]: valueInput.trim() || "string" });
    setKeyInput("");
    setValueInput("");
  };

  return (
    <div
      className="rounded-none border p-3"
      style={{ borderColor: C.border, background: C.inner }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: C.label, fontFamily: "'Roboto Mono', monospace" }}
        >
          {title}
        </p>
        <p className="text-[10px]" style={{ color: C.whiteFaint }}>
          {emptyLabel}
        </p>
      </div>

      <div className="mb-3 space-y-1.5">
        {Object.entries(value).length === 0 ? (
          <p className="text-[11px]" style={{ color: C.whiteFaint }}>
            No fields yet.
          </p>
        ) : (
          Object.entries(value).map(([k, t]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 border"
              style={{ borderColor: C.border }}
            >
              <div className="min-w-0 flex-1">
                <span
                  className="text-[11px] font-mono"
                  style={{ color: C.accent }}
                >
                  {k}
                </span>
                <span style={{ color: C.border }}>:</span>
                <span
                  className="ml-1 text-[11px] font-mono"
                  style={{ color: C.label }}
                >
                  {t}
                </span>
              </div>
              <button
                onClick={() => {
                  const n = { ...value };
                  delete n[k];
                  onChange(n);
                }}
                className="transition hover:opacity-70"
                style={{ color: C.whiteFaint }}
              >
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
            onChange={(e) =>
              i === 0
                ? setKeyInput(e.target.value)
                : setValueInput(e.target.value)
            }
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={ph}
            className="px-3 py-2 font-mono text-xs outline-none border transition"
            style={{
              background: C.bg,
              borderColor: C.border,
              color: C.white,
              fontFamily: "'Roboto Mono', monospace",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
        ))}
        <button
          onClick={addItem}
          className="px-3 py-2 border text-xs font-bold transition hover:opacity-80"
          style={{
            borderColor: C.accent,
            background: C.accentDim,
            color: C.accent,
          }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputClass = "w-full px-4 py-3 text-sm outline-none border transition";
const inputStyle = (focused = false) => ({
  background: C.inner,
  borderColor: focused ? C.accent : C.border,
  color: C.white,
  fontFamily: "'Inter', sans-serif",
});

function ThemedInput({
  value,
  onChange,
  placeholder,
  mono = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`${inputClass} ${mono ? "font-mono" : ""} ${className}`}
      style={{
        ...inputStyle(focused),
        fontFamily: mono ? "'Roboto Mono', monospace" : "'Inter', sans-serif",
      }}
    />
  );
}

function ThemedTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`${inputClass} resize-none`}
      style={inputStyle(focused)}
    />
  );
}

// ─── Route Modal ──────────────────────────────────────────────────────────────
function RouteModal({
  route,
  isOpen,
  onClose,
  onSave,
}: {
  route?: ApiRoute | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (r: ApiRoute) => void;
}) {
  const [form, setForm] = useState<ApiRoute>(route ?? createEmptyRoute());
  useEffect(() => {
    if (isOpen) setForm(route ?? createEmptyRoute());
  }, [isOpen, route]);

  const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.72)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: C.bg, borderColor: C.border }}
            >
              {/* Header */}
              <div
                className="mb-6 flex items-center justify-between border-b pb-4"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.accent,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Section // 02 /
                  </span>
                  <h2
                    className="text-lg font-bold text-white uppercase tracking-[0.08em]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {route ? "Edit Endpoint" : "Add Endpoint"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 transition hover:opacity-60"
                  style={{ color: C.label }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Endpoint Name
                  </label>
                  <ThemedInput
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                    placeholder="e.g., Get User"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color: C.label,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      Method
                    </label>
                    <select
                      value={form.method}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          method: e.target.value as HttpMethod,
                        })
                      }
                      className="w-full px-3 py-3 text-sm font-mono outline-none border transition"
                      style={{
                        background: C.inner,
                        borderColor: C.border,
                        color: C.white,
                      }}
                    >
                      {methods.map((m) => (
                        <option
                          key={m}
                          value={m}
                          style={{ color: METHOD_STYLE[m].color }}
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color: C.label,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      Path
                    </label>
                    <ThemedInput
                      value={form.path}
                      onChange={(v) => setForm({ ...form, path: v })}
                      placeholder="/api/v1/users"
                      mono
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Description
                  </label>
                  <ThemedTextarea
                    value={form.description}
                    onChange={(v) => setForm({ ...form, description: v })}
                    placeholder="Describe what this endpoint does..."
                  />
                </div>

                <div className="grid gap-3">
                  <KeyValueEditor
                    title="Request Body"
                    value={form.request.body}
                    onChange={(body) =>
                      setForm({ ...form, request: { ...form.request, body } })
                    }
                    emptyLabel="body"
                  />
                  <KeyValueEditor
                    title="Request Params"
                    value={form.request.params}
                    onChange={(params) =>
                      setForm({ ...form, request: { ...form.request, params } })
                    }
                    emptyLabel="params"
                  />
                  <KeyValueEditor
                    title="Request Query"
                    value={form.request.query}
                    onChange={(query) =>
                      setForm({ ...form, request: { ...form.request, query } })
                    }
                    emptyLabel="query"
                  />
                  <KeyValueEditor
                    title="Response Success"
                    value={form.response.success}
                    onChange={(success) =>
                      setForm({ ...form, response: { success } })
                    }
                    emptyLabel="response"
                  />
                </div>

                <div
                  className="flex items-center gap-3 border px-3 py-2.5"
                  style={{ borderColor: C.border }}
                >
                  <input
                    type="checkbox"
                    checked={form.authRequired}
                    onChange={(e) =>
                      setForm({ ...form, authRequired: e.target.checked })
                    }
                    className="w-4 h-4"
                    style={{ accentColor: C.accent }}
                  />
                  <span className="text-[13px]" style={{ color: C.whiteDim }}>
                    Requires Authentication
                  </span>
                  {form.authRequired && (
                    <Lock size={12} style={{ color: C.accent }} />
                  )}
                </div>

                <div
                  className="flex gap-2 pt-2 border-t"
                  style={{ borderColor: C.border }}
                >
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition hover:opacity-70"
                    style={{
                      borderColor: C.border,
                      color: C.label,
                      background: "transparent",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (form.name.trim() && form.path.trim()) {
                        onSave(form);
                        onClose();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition hover:opacity-80"
                    style={{
                      borderColor: C.accent,
                      color: C.accent,
                      background: C.accentDim,
                    }}
                  >
                    Save Endpoint
                  </button>
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
  event,
  isOpen,
  onClose,
  onSave,
}: {
  event?: WebSocketEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: WebSocketEvent) => void;
}) {
  const [form, setForm] = useState<WebSocketEvent>(event ?? createEmptyEvent());
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(event ?? createEmptyEvent());
      setKvKey("");
      setKvValue("");
    }
  }, [event, isOpen]);

  const addPayloadField = () => {
    if (kvKey.trim()) {
      setForm({
        ...form,
        payload: {
          ...form.payload,
          [kvKey.trim()]: kvValue.trim() || "string",
        },
      });
      setKvKey("");
      setKvValue("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.72)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: C.bg, borderColor: C.border }}
            >
              <div
                className="mb-6 flex items-center justify-between border-b pb-4"
                style={{ borderColor: C.border }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.accent,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    WS //
                  </span>
                  <h2
                    className="text-lg font-bold text-white uppercase tracking-[0.08em]"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    {event ? "Edit Event" : "Add Event"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 transition hover:opacity-60"
                  style={{ color: C.label }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Event Name
                  </label>
                  <ThemedInput
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                    placeholder="e.g., project:update"
                    mono
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Description
                  </label>
                  <ThemedTextarea
                    value={form.description}
                    onChange={(v) => setForm({ ...form, description: v })}
                    placeholder="What triggers this event..."
                  />
                </div>

                <div>
                  <label
                    className="mb-3 block text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Payload Fields
                  </label>
                  <div
                    className="mb-3 border p-3 space-y-1.5"
                    style={{ borderColor: C.border, background: C.inner }}
                  >
                    {Object.entries(form.payload).length === 0 ? (
                      <p
                        className="text-[11px]"
                        style={{ color: C.whiteFaint }}
                      >
                        No fields yet.
                      </p>
                    ) : (
                      Object.entries(form.payload).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 border"
                          style={{ borderColor: C.border }}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-[11px] font-mono"
                              style={{ color: C.accent }}
                            >
                              {k}
                            </span>
                            <span style={{ color: C.whiteFaint }}>: </span>
                            <span
                              className="text-[11px] font-mono"
                              style={{ color: C.label }}
                            >
                              {v}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const p = { ...form.payload };
                              delete p[k];
                              setForm({ ...form, payload: p });
                            }}
                            style={{ color: C.whiteFaint }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[
                      ["Field name", kvKey, setKvKey],
                      ["Type", kvValue, setKvValue],
                    ].map(([ph, val, set], i) => (
                      <input
                        key={i}
                        value={val as string}
                        onChange={(e) => (set as any)(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && addPayloadField()
                        }
                        placeholder={ph as string}
                        className="flex-1 px-3 py-2 text-xs font-mono outline-none border transition"
                        style={{
                          background: C.bg,
                          borderColor: C.border,
                          color: C.white,
                        }}
                      />
                    ))}
                    <button
                      onClick={addPayloadField}
                      className="px-3 py-2 border transition hover:opacity-80"
                      style={{
                        borderColor: C.accent,
                        background: C.accentDim,
                        color: C.accent,
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex gap-2 pt-2 border-t"
                  style={{ borderColor: C.border }}
                >
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition hover:opacity-70"
                    style={{
                      borderColor: C.border,
                      color: C.label,
                      background: "transparent",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (form.name.trim()) {
                        onSave(form);
                        onClose();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition hover:opacity-80"
                    style={{
                      borderColor: C.accent,
                      color: C.accent,
                      background: C.accentDim,
                    }}
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Stagger helpers ──────────────────────────────────────────────────────────
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.38, ease: EASE },
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="w-full h-px" style={{ background: C.border }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApiDesignPage() {
  const params = useParams();
  const router = useRouter();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId)
    ? rawProjectId[0]
    : rawProjectId;
  const resolvedProjectId =
    projectId && projectId !== "undefined" ? projectId : "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const jobState = useSelector((state: RootState) => state.job);
  const apiSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.api,
  );

  const [api, setApi] = useState<ApiSectionContent>(EMPTY);
  const [previewData, setPreviewData] = useState<ApiSectionContent | null>(
    null,
  );
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [shown, setShown] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [tab, setTab] = useState<"rest" | "realtime" | "auth">("rest");
  const [status, setStatus] = useState<string | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ApiRoute | null>(null);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<WebSocketEvent | null>(null);

  const isFetching = Boolean(apiSectionState?.fetch.loading);
  const isSaving = Boolean(apiSectionState?.save.loading);
  const isJobLoading =
    jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const error =
    apiSectionState?.fetch.error ??
    apiSectionState?.save.error ??
    (jobState.status === "failed" ? jobState.error : null);
  const canRegenerate =
    Boolean(previewData) || hasGeneratedOnce || hasApiContent(api);

  const fetchApi = useCallback(async () => {
    if (!resolvedProjectId) {
      setApi(EMPTY);
      setShown(false);
      return;
    }
    try {
      const result = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "api" }),
      ).unwrap();
      const normalized = normalizeApi(
        result.section?.content ?? result.section,
      );
      setApi(normalized);
      setShown(Boolean(hasApiContent(normalized)));
    } catch {
      setApi(EMPTY);
      setShown(false);
    }
  }, [dispatch, resolvedProjectId]);

  useEffect(() => {
    fetchApi();
  }, [fetchApi]);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 3500);
    return () => window.clearTimeout(t);
  }, [status]);

  const handleGenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before generating API suggestions.");
      return;
    }
    try {
      setPreviewData(null);
      dispatch(clearJobState());
      await dispatch(generateApi({ projectId: resolvedProjectId })).unwrap();
      setStatus("API generation queued. Processing now.");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue API generation.");
    }
  };

  const handleRegenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before regenerating.");
      return;
    }
    setStatus(null);
    setPreviewData(null);
    try {
      dispatch(clearJobState());
      await dispatch(
        regenerateSection({ projectId: resolvedProjectId, section: "api" }),
      ).unwrap();
      setStatus("API regeneration queued. Processing now.");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue API regeneration.");
    }
  };

  useEffect(() => {
    if (
      !jobState.jobId ||
      jobState.status === "completed" ||
      jobState.status === "failed"
    )
      return;
    dispatch(getJobStatusThunk({ jobId: jobState.jobId }));
    const t = window.setInterval(
      () => dispatch(getJobStatusThunk({ jobId: jobState.jobId! })),
      2500,
    );
    return () => window.clearInterval(t);
  }, [dispatch, jobState.jobId, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "completed") return;
    if (jobState.result) {
      setPreviewData(normalizeApi(jobState.result));
      setHasGeneratedOnce(true);
      setStatus("Generation completed. Review preview below.");
    } else {
      setStatus("Generation completed, but no preview was returned.");
    }
    dispatch(clearJobState());
  }, [dispatch, jobState.result, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "failed") return;
    setStatus(jobState.error ?? "API generation failed.");
  }, [jobState.error, jobState.status]);

  const handleSaveDraft = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before saving.");
      return;
    }
    if (!hasApiContent(api)) {
      setStatus("Add at least one API field before saving.");
      return;
    }
    try {
      const result = await dispatch(
        upsertSection({
          projectId: resolvedProjectId,
          type: "api",
          content: api,
        }),
      ).unwrap();
      const normalized = normalizeApi(
        result.section?.content ?? result.section,
      );
      setApi(normalized);
      setShown(true);
      setStatus("API section saved.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to save API section.");
    }
  };

  const show = () => {
    setShown(true);
    setStatus("Sample reference opened.");
  };
  const openFolder = () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before opening folder.");
      return;
    }
    router.push(`/projects/${resolvedProjectId}/folder`);
  };

  const upRoute = (r: ApiRoute) =>
    setApi((p) => ({ ...p, rest: p.rest.map((x) => (x.id === r.id ? r : x)) }));
  const delRoute = (id: string) =>
    setApi((p) => ({ ...p, rest: p.rest.filter((x) => x.id !== id) }));
  const addRoute = () => {
    setEditingRoute(null);
    setRouteModalOpen(true);
  };
  const saveRoute = (r: ApiRoute) => {
    if (editingRoute) upRoute(r);
    else setApi((p) => ({ ...p, rest: [...p.rest, r] }));
    setRouteModalOpen(false);
    setEditingRoute(null);
  };
  const editRoute = (r: ApiRoute) => {
    setEditingRoute(r);
    setRouteModalOpen(true);
  };

  const upEvent = (e: WebSocketEvent) =>
    setApi((p) => ({
      ...p,
      realtime: (p.realtime ?? []).map((x) => (x.id === e.id ? e : x)),
    }));
  const delEvent = (id: string) =>
    setApi((p) => ({
      ...p,
      realtime: (p.realtime ?? []).filter((x) => x.id !== id),
    }));
  const addEvent = () => {
    setEditingWs(null);
    setWsModalOpen(true);
  };
  const saveEvent = (e: WebSocketEvent) => {
    if (editingWs) upEvent(e);
    else setApi((p) => ({ ...p, realtime: [...(p.realtime ?? []), e] }));
    setWsModalOpen(false);
    setEditingWs(null);
  };
  const editEvent = (e: WebSocketEvent) => {
    setEditingWs(e);
    setWsModalOpen(true);
  };

  const applyAI = (s: ApplySuggestion) => {
    setApi((p) => normalizeApi({ ...p, ...s.payload }));
    setShown(true);
    setStatus("Applied suggestion locally.");
  };

  const handleAcceptPreview = () => {
    if (!previewData) return;
    setApi(previewData);
    setShown(true);
    setPreviewData(null);
    setStatus("Preview applied. Click Save to persist.");
  };
  const handleRejectPreview = () => {
    setPreviewData(null);
    setStatus(null);
  };

  return (
    <div
      ref={scrollRef}
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className={`mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 transition-[padding-right] duration-300 ${aiOpen ? "lg:pr-85" : "lg:pr-0"}`}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* ── Breadcrumb bar ── */}
          <motion.div
            variants={fadeUp(0)}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
            style={{ borderColor: C.border, background: C.inner }}
          >
            <div
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ fontFamily: "'Roboto Mono', monospace", color: C.label }}
            >
              <span>Planex</span>
              <span style={{ color: C.border }}>/</span>
              <span>Section</span>
              <span style={{ color: C.border }}>//</span>
              <span className="text-[10px]" style={{ color: C.accent }}>
                02 / API
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canRegenerate ? (
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    borderColor: "rgba(96,165,250,0.4)",
                    background: "rgba(96,165,250,0.08)",
                    color: "#93c5fd",
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  <RotateCcw size={11} />
                  {isJobLoading ? "Regenerating…" : "Regenerate"}
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    borderColor: "rgba(96,165,250,0.4)",
                    background: "rgba(96,165,250,0.08)",
                    color: "#93c5fd",
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  <Sparkles size={11} />
                  {isJobLoading ? "Generating…" : "Generate"}
                </button>
              )}
              <button
                onClick={fetchApi}
                className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                style={{
                  borderColor: C.border,
                  background: "transparent",
                  color: C.label,
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                <RotateCcw size={11} />
                Refresh
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80 disabled:opacity-50"
                style={{
                  borderColor: C.accent,
                  background: C.accentDim,
                  color: C.accent,
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                <Check size={11} />
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>

          {/* ── Loading bar ── */}
          {loading && (
            <div
              className="mb-4 flex items-center gap-3 border px-4 py-3"
              style={{ borderColor: C.accent, background: C.accentDim }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 rounded-full border-2"
                style={{ borderColor: C.accent, borderTopColor: "transparent" }}
              />
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: C.accent,
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                {isSaving
                  ? "Saving API section"
                  : isJobLoading
                    ? "Generating API section"
                    : "Loading API section"}
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div
              className="mb-4 border px-4 py-3"
              style={{
                borderColor: "rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.08)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: "#ef4444",
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                Error
              </p>
              <p
                className="mt-1 text-[12px]"
                style={{ color: "rgba(239,68,68,0.7)" }}
              >
                {error}
              </p>
            </div>
          )}

          {/* ── Status toast ── */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mb-4 border px-4 py-3 text-[12px]"
                style={{
                  borderColor: "rgba(96,165,250,0.3)",
                  background: "rgba(96,165,250,0.08)",
                  color: "#93c5fd",
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                {status}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Page title ── */}
          <motion.div variants={fadeUp(1)} className="mb-8">
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center border"
                style={{ borderColor: C.accent, background: C.accentDim }}
              >
                <Code2 size={18} style={{ color: C.accent }} />
              </div>
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1"
                  style={{
                    color: C.accent,
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  Section // 02
                </p>
                <h1
                  className="text-3xl font-black uppercase text-white tracking-[0.06em]"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  API Design
                </h1>
                <p
                  className="mt-1 text-[12px]"
                  style={{
                    color: C.label,
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  Define REST, WebSocket, and authentication layers.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Show / hide toggle ── */}
          <motion.div variants={fadeUp(2)} className="mb-6">
            {!shown ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={show}
                className="flex items-center gap-2 border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:opacity-80"
                style={{
                  borderColor: C.accent,
                  background: C.accentDim,
                  color: C.accent,
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                <ChevronDown size={12} />
                Show API Fields
              </motion.button>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em]"
                style={{
                  color: "#22c55e",
                  fontFamily: "'Roboto Mono',monospace",
                }}
              >
                <Check size={11} />
                Fields visible — edit below
              </motion.span>
            )}
          </motion.div>

          {/* ── Builder ── */}
          <AnimatePresence>
            {shown && (
              <motion.div
                variants={fadeUp(3)}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex flex-col gap-6"
              >
                {/* Sample reference notice */}
                {!hasApiContent(api) && (
                  <div
                    className="border p-4"
                    style={{
                      borderColor: C.border,
                      borderStyle: "dashed",
                      background: C.inner,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} style={{ color: C.accent }} />
                      <p
                        className="text-[9px] font-bold uppercase tracking-[0.22em]"
                        style={{
                          color: C.accent,
                          fontFamily: "'Roboto Mono',monospace",
                        }}
                      >
                        Sample Reference Only
                      </p>
                    </div>
                    <p
                      className="text-[12px] leading-relaxed mb-4"
                      style={{ color: C.label }}
                    >
                      The example structure below is for reference only. It is
                      not written into the saved API section.
                    </p>
                    <button
                      onClick={openFolder}
                      className="flex items-center gap-2 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                      style={{
                        borderColor: C.accent,
                        background: C.accentDim,
                        color: C.accent,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      <ArrowRight size={11} />
                      Show your folder
                    </button>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {MOCK.rest.slice(0, 2).map((route) => {
                        const s = METHOD_STYLE[route.method];
                        return (
                          <div
                            key={route.id}
                            className="border p-3"
                            style={{ borderColor: C.border, background: C.bg }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] border"
                                style={{
                                  background: s.bg,
                                  borderColor: s.border,
                                  color: s.color,
                                  fontFamily: "'Roboto Mono',monospace",
                                }}
                              >
                                {route.method}
                              </span>
                              <span
                                className="font-mono text-[12px]"
                                style={{ color: C.whiteDim }}
                              >
                                {route.path}
                              </span>
                            </div>
                            <p
                              className="mt-2 text-[11px]"
                              style={{ color: C.label }}
                            >
                              {route.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Tabs ── */}
                <div
                  className="flex gap-0 border"
                  style={{ borderColor: C.border, width: "fit-content" }}
                >
                  {(
                    [
                      ["rest", Globe, `REST ENDPOINTS  (${api.rest.length})`],
                      [
                        "realtime",
                        Wifi,
                        `WS EVENTS  (${api.realtime?.length ?? 0})`,
                      ],
                      ["auth", Key, "AUTH FLOW"],
                    ] as const
                  ).map(([id, Icon, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold tracking-[0.14em] transition-all duration-150 border-r last:border-r-0"
                      style={{
                        fontFamily: "'Roboto Mono',monospace",
                        borderColor: C.border,
                        background: tab === id ? C.accentDim : "transparent",
                        color: tab === id ? C.accent : C.label,
                        borderBottomColor:
                          tab === id ? C.accent : "transparent",
                        borderBottomWidth: 2,
                      }}
                    >
                      <Icon size={11} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ── */}
                <AnimatePresence mode="wait">
                  {/* REST */}
                  {tab === "rest" && (
                    <motion.div
                      key="rest"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-[9px] font-bold uppercase tracking-[0.22em]"
                          style={{
                            color: C.label,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          Active Routes
                        </p>
                        <button
                          onClick={addRoute}
                          className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                          style={{
                            borderColor: C.accent,
                            background: C.accentDim,
                            color: C.accent,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          <Plus size={11} />
                          Add Endpoint
                        </button>
                      </div>

                      {api.rest.length === 0 ? (
                        <div
                          className="flex flex-col items-center justify-center gap-3 border py-14 px-4"
                          style={{
                            borderColor: C.border,
                            borderStyle: "dashed",
                          }}
                        >
                          <Globe size={22} style={{ color: C.border }} />
                          <p
                            className="text-[12px]"
                            style={{ color: C.whiteFaint }}
                          >
                            No endpoints yet.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="border"
                          style={{ borderColor: C.border }}
                        >
                          {api.rest.map((r, i) => {
                            const s = METHOD_STYLE[r.method];
                            return (
                              <motion.div
                                key={r.id}
                                layout
                                className="flex items-center gap-3 px-4 py-3 group transition-colors"
                                style={{
                                  borderBottom:
                                    i < api.rest.length - 1
                                      ? `1px solid ${C.border}`
                                      : undefined,
                                  background: "transparent",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = C.inner)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                {/* Method badge */}
                                <span
                                  className="shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] border min-w-[46px] text-center"
                                  style={{
                                    background: s.bg,
                                    borderColor: s.border,
                                    color: s.color,
                                    fontFamily: "'Roboto Mono',monospace",
                                  }}
                                >
                                  {r.method}
                                </span>

                                {/* Path + desc */}
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-[13px] font-mono truncate"
                                    style={{ color: C.white }}
                                  >
                                    {r.path}
                                  </p>
                                  {r.description && (
                                    <p
                                      className="text-[11px] truncate mt-0.5"
                                      style={{ color: C.label }}
                                    >
                                      {r.description}
                                    </p>
                                  )}
                                </div>

                                {/* Auth badge */}
                                {r.authRequired && (
                                  <div
                                    className="flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] shrink-0"
                                    style={{
                                      borderColor: C.accentMid,
                                      background: C.accentDim,
                                      color: C.accent,
                                      fontFamily: "'Roboto Mono',monospace",
                                    }}
                                  >
                                    <Lock size={9} />
                                    AUTH
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => editRoute(r)}
                                    className="p-1.5 border transition hover:opacity-70"
                                    style={{
                                      borderColor: C.border,
                                      color: C.label,
                                    }}
                                  >
                                    <ChevronDown
                                      size={12}
                                      className="-rotate-90"
                                    />
                                  </button>
                                  <button
                                    onClick={() => delRoute(r.id)}
                                    className="p-1.5 border transition hover:opacity-70"
                                    style={{
                                      borderColor: "rgba(239,68,68,0.3)",
                                      color: "rgba(239,68,68,0.6)",
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* WebSocket */}
                  {tab === "realtime" && (
                    <motion.div
                      key="realtime"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-[9px] font-bold uppercase tracking-[0.22em]"
                          style={{
                            color: C.label,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          WebSocket Events
                        </p>
                        <button
                          onClick={addEvent}
                          className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                          style={{
                            borderColor: C.accent,
                            background: C.accentDim,
                            color: C.accent,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          <Plus size={11} />
                          Add Event
                        </button>
                      </div>

                      {(api.realtime ?? []).length === 0 ? (
                        <div
                          className="flex flex-col items-center justify-center gap-3 border py-14 px-4"
                          style={{
                            borderColor: C.border,
                            borderStyle: "dashed",
                          }}
                        >
                          <Wifi size={22} style={{ color: C.border }} />
                          <p
                            className="text-[12px]"
                            style={{ color: C.whiteFaint }}
                          >
                            No WebSocket events defined.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {(api.realtime ?? []).map((e) => (
                            <motion.div
                              key={e.id}
                              layout
                              className="flex flex-col gap-3 border p-4 group transition-colors"
                              style={{
                                borderColor: C.border,
                                background: C.inner,
                              }}
                              onMouseEnter={(ev) =>
                                (ev.currentTarget.style.borderColor =
                                  C.accentMid)
                              }
                              onMouseLeave={(ev) =>
                                (ev.currentTarget.style.borderColor = C.border)
                              }
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-mono text-[13px] truncate"
                                    style={{ color: C.accent }}
                                  >
                                    {e.name}
                                  </p>
                                  <p
                                    className="mt-1 text-[11px] line-clamp-2"
                                    style={{ color: C.label }}
                                  >
                                    {e.description}
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => editEvent(e)}
                                    className="p-1.5 border"
                                    style={{
                                      borderColor: C.border,
                                      color: C.label,
                                    }}
                                  >
                                    <ChevronDown
                                      size={12}
                                      className="-rotate-90"
                                    />
                                  </button>
                                  <button
                                    onClick={() => delEvent(e.id)}
                                    className="p-1.5 border"
                                    style={{
                                      borderColor: "rgba(239,68,68,0.3)",
                                      color: "rgba(239,68,68,0.6)",
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {Object.entries(e.payload).length > 0 && (
                                <div
                                  className="border p-2"
                                  style={{
                                    borderColor: C.border,
                                    background: C.bg,
                                  }}
                                >
                                  <p
                                    className="text-[8px] font-bold uppercase tracking-[0.2em] mb-1.5"
                                    style={{
                                      color: C.label,
                                      fontFamily: "'Roboto Mono',monospace",
                                    }}
                                  >
                                    Payload
                                  </p>
                                  <div className="space-y-1">
                                    {Object.entries(e.payload)
                                      .slice(0, 2)
                                      .map(([k, v]) => (
                                        <div
                                          key={k}
                                          className="text-[10px] font-mono"
                                          style={{
                                            fontFamily:
                                              "'Roboto Mono',monospace",
                                          }}
                                        >
                                          <span style={{ color: C.accent }}>
                                            {k}
                                          </span>
                                          <span style={{ color: C.border }}>
                                            :{" "}
                                          </span>
                                          <span style={{ color: C.label }}>
                                            {v}
                                          </span>
                                        </div>
                                      ))}
                                    {Object.entries(e.payload).length > 2 && (
                                      <div
                                        className="text-[10px]"
                                        style={{ color: C.whiteFaint }}
                                      >
                                        +{Object.entries(e.payload).length - 2}{" "}
                                        more fields
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

                  {/* Auth */}
                  {tab === "auth" && (
                    <motion.div
                      key="auth"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col gap-5"
                    >
                      <p
                        className="text-[9px] font-bold uppercase tracking-[0.22em]"
                        style={{
                          color: C.label,
                          fontFamily: "'Roboto Mono',monospace",
                        }}
                      >
                        Authentication Flow
                      </p>

                      {/* Auth hero block (like screenshot) */}
                      <div
                        className="border p-5"
                        style={{ borderColor: C.accent, background: C.inner }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Lock size={12} style={{ color: C.accent }} />
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.22em]"
                            style={{
                              color: C.accent,
                              fontFamily: "'Roboto Mono',monospace",
                            }}
                          >
                            Authentication Flow
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {AUTH_TYPES.map((t) => {
                            const { color, Icon } = AUTH_STYLE[t];
                            const active = api.auth.type === t;
                            return (
                              <button
                                key={t}
                                onClick={() =>
                                  setApi((p) => ({
                                    ...p,
                                    auth: { ...p.auth, type: t },
                                  }))
                                }
                                className="flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] transition-all"
                                style={{
                                  fontFamily: "'Roboto Mono',monospace",
                                  background: active
                                    ? `${color}18`
                                    : "transparent",
                                  borderColor: active ? color : C.border,
                                  color: active ? color : C.label,
                                }}
                              >
                                <Icon size={11} />
                                {t}
                              </button>
                            );
                          })}
                        </div>

                        {/* Description */}
                        <div
                          className="border p-3 mb-0"
                          style={{ borderColor: C.border, background: C.bg }}
                        >
                          <EditField
                            value={api.auth.description}
                            onChange={(v) =>
                              setApi((p) => ({
                                ...p,
                                auth: { ...p.auth, description: v },
                              }))
                            }
                            placeholder="Describe the auth strategy…"
                            className="text-[13px] leading-relaxed w-full"
                          />
                        </div>
                      </div>

                      {/* Protected routes */}
                      <div
                        className="border p-4"
                        style={{ borderColor: C.border, background: C.inner }}
                      >
                        <p
                          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3"
                          style={{
                            color: C.label,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          Active Routes
                        </p>
                        <div className="space-y-1.5 mb-3">
                          {api.auth.routes.map((r, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 group border px-3 py-2"
                              style={{ borderColor: C.border }}
                            >
                              <ArrowRight
                                size={10}
                                style={{ color: C.accent }}
                                className="shrink-0"
                              />
                              <code
                                className="flex-1 text-[12px] font-mono"
                                style={{
                                  fontFamily: "'Roboto Mono',monospace",
                                  color: C.whiteDim,
                                }}
                              >
                                <EditField
                                  value={r}
                                  onChange={(v) => {
                                    const routes = [...api.auth.routes];
                                    routes[i] = v;
                                    setApi((p) => ({
                                      ...p,
                                      auth: { ...p.auth, routes },
                                    }));
                                  }}
                                  placeholder="/api/v1/…"
                                  mono
                                  className="text-[12px]"
                                />
                              </code>
                              <button
                                onClick={() =>
                                  setApi((p) => ({
                                    ...p,
                                    auth: {
                                      ...p.auth,
                                      routes: p.auth.routes.filter(
                                        (_, j) => j !== i,
                                      ),
                                    },
                                  }))
                                }
                                className="p-1 transition opacity-0 group-hover:opacity-100"
                                style={{ color: C.label }}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setApi((p) => ({
                              ...p,
                              auth: {
                                ...p.auth,
                                routes: [...p.auth.routes, "/api/v1/"],
                              },
                            }))
                          }
                          className="flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                          style={{
                            borderColor: C.border,
                            background: "transparent",
                            color: C.label,
                            fontFamily: "'Roboto Mono',monospace",
                          }}
                        >
                          <Plus size={10} />
                          Add Route
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Empty nudge ── */}
          {!shown && (
            <motion.div
              variants={fadeUp(4)}
              className="flex flex-col items-center text-center gap-4 border py-20 px-4"
              style={{ borderColor: C.border, borderStyle: "dashed" }}
            >
              <div
                className="w-11 h-11 border flex items-center justify-center"
                style={{ borderColor: C.accent, background: C.accentDim }}
              >
                <Code2 size={18} style={{ color: C.accent }} />
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className="text-[13px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: C.label, fontFamily: "'Roboto',sans-serif" }}
                >
                  No API defined yet
                </p>
                <p
                  className="text-[11px] max-w-xs leading-relaxed"
                  style={{ color: C.whiteFaint }}
                >
                  Click "Show API Fields" above or use the AI Copilot to
                  generate your API structure.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Preview modal ── */}
      <AnimatePresence>
        {previewData && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleRejectPreview}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.72)" }}
              aria-label="Close preview"
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6 shadow-2xl"
              style={{ background: C.bg, borderColor: C.accent }}
            >
              <div
                className="mb-6 flex items-center justify-between border-b pb-4"
                style={{ borderColor: C.border }}
              >
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1"
                    style={{
                      color: C.accent,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Section // 02 / Preview
                  </p>
                  <p
                    className="text-lg font-black uppercase tracking-[0.06em] text-white"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    Generated API
                  </p>
                </div>
                <button
                  onClick={handleRejectPreview}
                  className="p-1 transition hover:opacity-60"
                  style={{ color: C.label }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                {previewData.rest.length > 0 ? (
                  <div>
                    <p
                      className="mb-3 text-[9px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color: C.label,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      REST Endpoints
                    </p>
                    <div className="border" style={{ borderColor: C.border }}>
                      {previewData.rest.map((route, i) => {
                        const s = METHOD_STYLE[route.method];
                        return (
                          <div
                            key={route.id}
                            className="flex flex-wrap items-center gap-3 px-4 py-3"
                            style={{
                              borderBottom:
                                i < previewData.rest.length - 1
                                  ? `1px solid ${C.border}`
                                  : undefined,
                            }}
                          >
                            <span
                              className="px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] border min-w-[46px] text-center"
                              style={{
                                background: s.bg,
                                borderColor: s.border,
                                color: s.color,
                                fontFamily: "'Roboto Mono',monospace",
                              }}
                            >
                              {route.method}
                            </span>
                            <span
                              className="font-mono text-[12px]"
                              style={{ color: C.whiteDim }}
                            >
                              {route.path}
                            </span>
                            {route.authRequired && (
                              <span
                                className="border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                                style={{
                                  borderColor: C.accentMid,
                                  background: C.accentDim,
                                  color: C.accent,
                                  fontFamily: "'Roboto Mono',monospace",
                                }}
                              >
                                Auth Required
                              </span>
                            )}
                            <span
                              className="text-[12px] ml-auto"
                              style={{ color: C.label }}
                            >
                              {route.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="border p-4 text-[12px]"
                    style={{ borderColor: C.border, color: C.label }}
                  >
                    No REST endpoints were generated.
                  </div>
                )}

                {(previewData.realtime ?? []).length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[9px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color: C.label,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      WebSocket Events
                    </p>
                    <div className="space-y-2">
                      {(previewData.realtime ?? []).map((ev) => (
                        <div
                          key={ev.id}
                          className="border p-3"
                          style={{ borderColor: C.border, background: C.inner }}
                        >
                          <p
                            className="text-[13px] font-mono"
                            style={{ color: C.accent }}
                          >
                            {ev.name}
                          </p>
                          <p
                            className="mt-1 text-[11px]"
                            style={{ color: C.label }}
                          >
                            {ev.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p
                    className="mb-3 text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: C.label,
                      fontFamily: "'Roboto Mono',monospace",
                    }}
                  >
                    Auth Flow
                  </p>
                  <div
                    className="border p-4"
                    style={{ borderColor: C.border, background: C.inner }}
                  >
                    <span
                      className="border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        borderColor: C.accentMid,
                        background: C.accentDim,
                        color: C.accent,
                        fontFamily: "'Roboto Mono',monospace",
                      }}
                    >
                      {previewData.auth.type}
                    </span>
                    <p
                      className="mt-3 text-[13px]"
                      style={{ color: C.whiteDim }}
                    >
                      {previewData.auth.description ||
                        "No auth description provided."}
                    </p>
                    {previewData.auth.routes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previewData.auth.routes.map((r) => (
                          <span
                            key={r}
                            className="border px-2 py-1 font-mono text-[11px]"
                            style={{
                              borderColor: C.border,
                              background: C.bg,
                              color: C.label,
                              fontFamily: "'Roboto Mono',monospace",
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="mt-6 flex justify-end gap-3 border-t pt-6"
                style={{ borderColor: C.border }}
              >
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="border px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    borderColor: "rgba(96,165,250,0.4)",
                    background: "rgba(96,165,250,0.08)",
                    color: "#93c5fd",
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  Regenerate
                </button>
                <button
                  onClick={handleRejectPreview}
                  className="border px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                  style={{
                    borderColor: C.border,
                    background: "transparent",
                    color: C.label,
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={handleAcceptPreview}
                  className="border px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                  style={{
                    borderColor: "rgba(34,197,94,0.4)",
                    background: "rgba(34,197,94,0.1)",
                    color: "#4ade80",
                    fontFamily: "'Roboto Mono',monospace",
                  }}
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AIRightSidebar
        onApplySuggestion={applyAI}
        projectDescription="Design your API endpoints, WebSocket events, and authentication flow."
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
      />

      <RouteModal
        route={editingRoute}
        isOpen={routeModalOpen}
        onClose={() => {
          setRouteModalOpen(false);
          setEditingRoute(null);
        }}
        onSave={saveRoute}
      />
      <WsModal
        event={editingWs}
        isOpen={wsModalOpen}
        onClose={() => {
          setWsModalOpen(false);
          setEditingWs(null);
        }}
        onSave={saveEvent}
      />
    </div>
  );
}
