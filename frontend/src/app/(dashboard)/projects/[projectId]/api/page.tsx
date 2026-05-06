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
  AlertCircle,
  Lock,
  Globe,
  Shield,
  ArrowRight,
  RotateCcw,
  Wifi,
  Key,
  Trash2,
} from "lucide-react";
import AIRightSidebar, { type ApplySuggestion } from "@/src/components/layout/project-section/AIRightSidebar";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateApi,
  getJobStatusThunk,
} from "@/src/store/slices/jobSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

// Types
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

const AUTH_TYPES: AuthFlow["type"][] = ["JWT", "OAuth", "Session"];

const isAuthType = (value: unknown): value is AuthFlow["type"] =>
  value === "JWT" || value === "OAuth" || value === "Session";

const emptyRecord = () => ({}) as Record<string, string>;

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (result, [key, entry]) => {
      if (typeof entry === "string") {
        result[key] = entry;
      }

      return result;
    },
    {},
  );
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
    ? raw.rest
        .map((route) => {
          if (!route || typeof route !== "object") return null;

          const sourceRoute = route as Partial<ApiRoute>;
          if (
            typeof sourceRoute.id !== "string" ||
            typeof sourceRoute.name !== "string" ||
            typeof sourceRoute.path !== "string" ||
            typeof sourceRoute.description !== "string" ||
            !sourceRoute.method ||
            !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(sourceRoute.method)
          ) {
            return null;
          }

          return {
            id: sourceRoute.id,
            name: sourceRoute.name,
            method: sourceRoute.method as HttpMethod,
            path: sourceRoute.path,
            description: sourceRoute.description,
            request: {
              body: toStringRecord(sourceRoute.request?.body),
              params: toStringRecord(sourceRoute.request?.params),
              query: toStringRecord(sourceRoute.request?.query),
            },
            response: {
              success: toStringRecord(sourceRoute.response?.success),
            },
            authRequired: Boolean(sourceRoute.authRequired),
          } satisfies ApiRoute;
        })
        .filter(Boolean) as ApiRoute[]
    : [];

  const realtime = Array.isArray(raw.realtime)
    ? raw.realtime
        .map((event) => {
          if (!event || typeof event !== "object") return null;

          const sourceEvent = event as Partial<WebSocketEvent>;
          if (
            typeof sourceEvent.id !== "string" ||
            typeof sourceEvent.name !== "string" ||
            typeof sourceEvent.description !== "string"
          ) {
            return null;
          }

          return {
            id: sourceEvent.id,
            name: sourceEvent.name,
            description: sourceEvent.description,
            payload: toStringRecord(sourceEvent.payload),
          } satisfies WebSocketEvent;
        })
        .filter(Boolean) as WebSocketEvent[]
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
        ? authSource.routes.filter((route): route is string => typeof route === "string")
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
  request: {
    body: emptyRecord(),
    params: emptyRecord(),
    query: emptyRecord(),
  },
  response: { success: emptyRecord() },
  authRequired: false,
});

const createEmptyEvent = (): WebSocketEvent => ({
  id: uid(),
  name: "",
  description: "",
  payload: emptyRecord(),
});

// Mock data
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
      request: {
        body: {},
        params: { id: "string" },
        query: {},
      },
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
      request: {
        body: {},
        params: { id: "string" },
        query: {},
      },
      response: { success: { deleted: "boolean" } },
      authRequired: true,
    },
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

const hasApiContent = (api: ApiSectionContent) =>
  api.rest.length > 0 ||
  (api.realtime?.length ?? 0) > 0 ||
  Boolean(api.auth.description.trim()) ||
  api.auth.routes.length > 0 ||
  api.auth.type !== "JWT";

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
    const nextKey = keyInput.trim();

    if (!nextKey) return;

    onChange({
      ...value,
      [nextKey]: valueInput.trim() || "string",
    });
    setKeyInput("");
    setValueInput("");
  };

  return (
    <div className="rounded-md border border-white/8 bg-[#0f1520] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </p>
        <p className="text-[10px] text-white/25">{emptyLabel}</p>
      </div>

      <div className="mb-3 space-y-2">
        {Object.entries(value).length === 0 ? (
          <p className="text-xs text-white/25">No fields yet.</p>
        ) : (
          Object.entries(value).map(([key, fieldType]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-sm border border-white/5 bg-[#0b1019] px-2.5 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-mono text-purple-300">{key}</span>
                <span className="text-white/15">:</span>
                <span className="ml-1 text-xs font-mono text-white/45">{fieldType}</span>
              </div>
              <button
                onClick={() => {
                  const next = { ...value };
                  delete next[key];
                  onChange(next);
                }}
                className="text-white/20 transition hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Field name"
          className="rounded-md border border-white/8 bg-[#0b1019] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30"
        />
        <input
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Type"
          className="rounded-md border border-white/8 bg-[#0b1019] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30"
        />
        <button
          onClick={addItem}
          className="rounded-md border border-orange-500/35 bg-orange-500/12 px-3 py-2 text-orange-400 transition hover:bg-orange-500/20"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// Modal: Add/Edit Route
function RouteModal({ route, isOpen, onClose, onSave }: {
  route?: ApiRoute | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: ApiRoute) => void;
}) {
  const [form, setForm] = useState<ApiRoute>(route ? route : createEmptyRoute());

  useEffect(() => {
    if (!isOpen) return;

    setForm(route ? route : createEmptyRoute());
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl rounded-xl border border-white/8 bg-[#0b1019] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {route ? "Edit Endpoint" : "Add Endpoint"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-white/35 transition hover:bg-white/8 hover:text-white/55"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Endpoint Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Get User"
                    className="w-full rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                  />
                </div>

                {/* Method & Path */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                      Method
                    </label>
                    <select
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value as HttpMethod })}
                      className="w-full rounded-md border border-white/8 bg-[#0f1520] px-3 py-3 text-sm font-mono text-white/80 outline-none transition hover:border-white/12 focus:border-orange-500/30"
                    >
                      {methods.map((m) => (
                        <option key={m} value={m} style={{ color: METHOD_STYLE[m].color }}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                      Path
                    </label>
                    <input
                      value={form.path}
                      onChange={(e) => setForm({ ...form, path: e.target.value })}
                      placeholder="/api/v1/users"
                      className="w-full rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what this endpoint does..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                  />
                </div>

                <div className="grid gap-3">
                  <KeyValueEditor
                    title="Request Body"
                    value={form.request.body}
                    onChange={(body) =>
                      setForm({
                        ...form,
                        request: { ...form.request, body },
                      })
                    }
                    emptyLabel="saved as body"
                  />
                  <KeyValueEditor
                    title="Request Params"
                    value={form.request.params}
                    onChange={(params) =>
                      setForm({
                        ...form,
                        request: { ...form.request, params },
                      })
                    }
                    emptyLabel="saved as params"
                  />
                  <KeyValueEditor
                    title="Request Query"
                    value={form.request.query}
                    onChange={(query) =>
                      setForm({
                        ...form,
                        request: { ...form.request, query },
                      })
                    }
                    emptyLabel="saved as query"
                  />
                  <KeyValueEditor
                    title="Response Success"
                    value={form.response.success}
                    onChange={(success) =>
                      setForm({
                        ...form,
                        response: { success },
                      })
                    }
                    emptyLabel="saved as response"
                  />
                </div>

                {/* Auth Required */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.authRequired}
                      onChange={(e) => setForm({ ...form, authRequired: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20"
                    />
                    <span className="text-sm text-white/70">Requires Authentication</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-md border border-white/8 bg-transparent px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white/80"
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
                    className="flex-1 rounded-md border border-orange-500/35 bg-orange-500/12 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 hover:border-orange-500/50"
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

// Modal: Add/Edit WebSocket Event
function WsModal({ event, isOpen, onClose, onSave }: {
  event?: WebSocketEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: WebSocketEvent) => void;
}) {
  const [form, setForm] = useState<WebSocketEvent>(event || createEmptyEvent());
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setForm(event || createEmptyEvent());
    setKvKey("");
    setKvValue("");
  }, [event, isOpen]);

  const addPayloadField = () => {
    if (kvKey.trim()) {
      setForm({
        ...form,
        payload: { ...form.payload, [kvKey.trim()]: kvValue.trim() || "string" },
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-xl rounded-xl border border-white/8 bg-[#0b1019] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {event ? "Edit Event" : "Add Event"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-white/35 transition hover:bg-white/8 hover:text-white/55"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Event Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., project:update"
                    className="w-full rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What triggers this event..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                  />
                </div>

                {/* Payload Fields */}
                <div>
                  <label className="mb-3 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Payload Fields
                  </label>
                  <div className="mb-3 space-y-2 rounded-md border border-white/8 bg-[#0f1520] p-3">
                    {Object.entries(form.payload).length === 0 ? (
                      <p className="text-xs text-white/25">No fields yet.</p>
                    ) : (
                      Object.entries(form.payload).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-2 rounded-sm border border-white/5 bg-[#0b1019] px-2.5 py-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-mono text-purple-300">{key}</span>
                            <span className="text-white/15">:</span>
                            <span className="text-xs font-mono text-white/45 ml-1">{val}</span>
                          </div>
                          <button
                            onClick={() => {
                              const newPayload = { ...form.payload };
                              delete newPayload[key];
                              setForm({ ...form, payload: newPayload });
                            }}
                            className="text-white/20 transition hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Field */}
                  <div className="flex gap-2">
                    <input
                      value={kvKey}
                      onChange={(e) => setKvKey(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPayloadField()}
                      placeholder="Field name"
                      className="flex-1 rounded-md border border-white/8 bg-[#0f1520] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30"
                    />
                    <input
                      value={kvValue}
                      onChange={(e) => setKvValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPayloadField()}
                      placeholder="Type"
                      className="flex-1 rounded-md border border-white/8 bg-[#0f1520] px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30"
                    />
                    <button
                      onClick={addPayloadField}
                      className="rounded-md border border-orange-500/35 bg-orange-500/12 px-3 py-2 text-orange-400 transition hover:bg-orange-500/20"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-md border border-white/8 bg-transparent px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white/80"
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
                    className="flex-1 rounded-md border border-orange-500/35 bg-orange-500/12 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 hover:border-orange-500/50"
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

// Page
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE },
  },
});

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
  const authTypes = AUTH_TYPES;

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

      const normalized = normalizeApi(result.section?.content ?? result.section);
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

    const timer = window.setTimeout(() => {
      setStatus(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [status]);

  const handleGenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before generating API suggestions.");
      return;
    }

    try {
      dispatch(clearJobState());
      await dispatch(generateApi({ projectId: resolvedProjectId })).unwrap();

      setStatus("API generation queued. We are processing it now.");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue API generation.");
    }
  };

  useEffect(() => {
    if (!jobState.jobId) {
      return;
    }

    if (jobState.status === "completed" || jobState.status === "failed") {
      return;
    }

    dispatch(getJobStatusThunk({ jobId: jobState.jobId }));

    const pollTimer = window.setInterval(() => {
      dispatch(getJobStatusThunk({ jobId: jobState.jobId! }));
    }, 2500);

    return () => {
      window.clearInterval(pollTimer);
    };
  }, [dispatch, jobState.jobId, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "completed") {
      return;
    }

    fetchApi();
    setStatus("API generation completed.");
    dispatch(clearJobState());
  }, [dispatch, fetchApi, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "failed") {
      return;
    }

    setStatus(jobState.error ?? "API generation failed.");
  }, [jobState.error, jobState.status]);

  const handleSaveDraft = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before saving the API section.");
      return;
    }

    if (!hasApiContent(api)) {
      setStatus("Add at least one API field before saving the API section.");
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

      const normalized = normalizeApi(result.section?.content ?? result.section);
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
      setStatus("Select a project before opening the folder section.");
      return;
    }

    router.push(`/projects/${resolvedProjectId}/folder`);
  };

  const upRoute  = (r: ApiRoute) => setApi((p) => ({ ...p, rest: p.rest.map((x) => x.id === r.id ? r : x) }));
  const delRoute = (id: string) => setApi((p) => ({ ...p, rest: p.rest.filter((x) => x.id !== id) }));
  const addRoute = () => { setEditingRoute(null); setRouteModalOpen(true); };
  const saveRoute = (r: ApiRoute) => {
    if (editingRoute) {
      upRoute(r);
    } else {
      setApi((p) => ({ ...p, rest: [...p.rest, r] }));
    }
    setRouteModalOpen(false);
    setEditingRoute(null);
  };
  const editRoute = (r: ApiRoute) => { setEditingRoute(r); setRouteModalOpen(true); };

  const upEvent  = (e: WebSocketEvent) => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).map((x) => x.id === e.id ? e : x) }));
  const delEvent = (id: string) => setApi((p) => ({ ...p, realtime: (p.realtime ?? []).filter((x) => x.id !== id) }));
  const addEvent = () => { setEditingWs(null); setWsModalOpen(true); };
  const saveEvent = (e: WebSocketEvent) => {
    if (editingWs) {
      upEvent(e);
    } else {
      setApi((p) => ({ ...p, realtime: [...(p.realtime ?? []), e] }));
    }
    setWsModalOpen(false);
    setEditingWs(null);
  };
  const editEvent = (e: WebSocketEvent) => { setEditingWs(e); setWsModalOpen(true); };

  const applyAI = (s: ApplySuggestion) => {
    setApi((p) => normalizeApi({ ...p, ...s.payload }));
    setShown(true);
    setStatus("Applied suggestion locally.");
  };

  return (
    <div
      ref={scrollRef}
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className={`mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 transition-[padding-right] duration-300 ${
            aiOpen ? "lg:pr-85" : "lg:pr-0"
          }`}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp(0)}
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/8 bg-[#0b1019] px-4 py-3"
          >
            <div
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              <span>Planex</span>
              <span>/</span>
              <span>API</span>
              <span>/</span>
              <span className="text-white/80">API</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-blue-500/35 bg-blue-500/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200 transition hover:bg-blue-500/18 disabled:opacity-60"
              >
                <Sparkles size={12} />
                {isJobLoading ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={fetchApi}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:text-white/85"
              >
                <RotateCcw size={12} />
                Refresh
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Check size={12} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>

          {loading && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400/90">
                {isSaving
                  ? "Saving API section"
                  : isJobLoading
                    ? "Generating API section"
                    : "Loading API section"}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div>
                <p className="font-semibold text-red-500">Error</p>
                <p className="mt-1 text-sm text-red-500/70">{error}</p>
              </div>
            </div>
          )}

          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-4 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-200/90"
            >
              {status}
            </motion.div>
          )}

          <motion.div variants={fadeUp(1)} className="mb-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <Code2 size={20} className="text-orange-500" />
                </div>
                <div>
                  <h1
                    className="text-3xl font-bold uppercase text-white"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    API
                  </h1>
                  <p
                    className="mt-1 text-sm text-white/45"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    Define REST, WebSocket, and authentication layers.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(2)} className="mb-6">
            {!shown ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={show}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <ChevronDown size={13} />
                Show API Fields
              </motion.button>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[11px] text-green-400/70 font-mono tracking-[0.08em]"
              >
                <Check size={12} /> Fields visible — edit below
              </motion.span>
            )}
          </motion.div>

          <AnimatePresence>
            {shown && (
              <motion.div
                variants={fadeUp(3)}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex flex-col gap-6"
              >
                {!hasApiContent(api) && (
                  <div className="rounded-md border border-dashed border-white/10 bg-white/2 p-4">
                    <div className="flex items-center gap-2 text-orange-400">
                      <Sparkles size={14} />
                      <p
                        className="text-[10px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      >
                        Sample Reference Only
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      The example structure below is for reference only. It is not written into the saved API section.
                    </p>
                    <button
                      onClick={openFolder}
                      className="mt-4 flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
                    >
                      <ArrowRight size={12} />
                      Show your folder
                    </button>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {MOCK.rest.slice(0, 2).map((route) => (
                        <div key={route.id} className="rounded-md border border-white/8 bg-[#0f1520] p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-sm px-2 py-1 text-[10px] font-bold tracking-[0.08em]"
                              style={{
                                background: METHOD_STYLE[route.method].bg,
                                border: `1px solid ${METHOD_STYLE[route.method].border}`,
                                color: METHOD_STYLE[route.method].color,
                              }}
                            >
                              {route.method}
                            </span>
                            <span className="font-mono text-xs text-white/70">{route.path}</span>
                          </div>
                          <p className="mt-2 text-xs text-white/45">{route.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-white/2 border border-white/8 rounded-md p-1 w-fit flex-wrap">
                  {([
                    ["rest", Globe, `REST (${api.rest.length})`],
                    ["realtime", Wifi, `WebSocket (${api.realtime?.length ?? 0})`],
                    ["auth", Key, "Auth Flow"],
                  ] as const).map(([id, Icon, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold tracking-[0.08em] transition-all duration-200 cursor-pointer ${
                        tab === id
                          ? "bg-orange-500/12 border border-orange-500/25 text-orange-400"
                          : "text-white/35 hover:text-white/55"
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* REST */}
                  {tab === "rest" && (
                    <motion.div
                      key="rest"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                          style={{ fontFamily: "'Roboto', sans-serif" }}
                        >
                          REST Endpoints
                        </p>
                        <button
                          onClick={addRoute}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
                        >
                          <Plus size={12} />
                          Add Endpoint
                        </button>
                      </div>
                      {api.rest.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/8 rounded-md py-12 px-4">
                          <Globe size={24} className="text-white/15" />
                          <p className="text-sm text-white/25">No endpoints yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {api.rest.map((r) => {
                            const s = METHOD_STYLE[r.method];
                            return (
                              <motion.div
                                key={r.id}
                                layout
                                className="flex items-center gap-3 rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 hover:border-white/12 transition-colors group"
                              >
                                <div
                                  className="rounded-sm px-2 py-1 text-[10px] font-bold tracking-[0.08em] shrink-0"
                                  style={{
                                    background: s.bg,
                                    borderColor: s.border,
                                    color: s.color,
                                    border: `1px solid ${s.border}`,
                                  }}
                                >
                                  {r.method}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-mono text-white/80 truncate">{r.path}</p>
                                  <p className="text-xs text-white/40 truncate">{r.description}</p>
                                </div>
                                {r.authRequired && (
                                  <div className="flex items-center gap-1 rounded-sm bg-orange-500/10 px-2 py-1 text-[10px] text-orange-400 shrink-0">
                                    <Lock size={10} />
                                    AUTH
                                  </div>
                                )}
                                <button
                                  onClick={() => editRoute(r)}
                                  className="rounded-md p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/70"
                                >
                                  <ChevronDown size={14} className="-rotate-90" />
                                </button>
                                <button
                                  onClick={() => delRoute(r.id)}
                                  className="rounded-md p-1.5 text-white/35 transition hover:bg-white/8 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                          style={{ fontFamily: "'Roboto', sans-serif" }}
                        >
                          WebSocket Events
                        </p>
                        <button
                          onClick={addEvent}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
                        >
                          <Plus size={12} />
                          Add Event
                        </button>
                      </div>
                      {(api.realtime ?? []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/8 rounded-md py-12 px-4">
                          <Wifi size={24} className="text-white/15" />
                          <p className="text-sm text-white/25">No WebSocket events defined.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {(api.realtime ?? []).map((e) => (
                            <motion.div
                              key={e.id}
                              layout
                              className="flex flex-col gap-3 rounded-md border border-white/8 bg-[#0f1520] p-4 hover:border-white/12 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-sm text-purple-300 truncate">{e.name}</p>
                                  <p className="mt-1 text-xs text-white/45 line-clamp-2">{e.description}</p>
                                </div>
                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => editEvent(e)}
                                    className="rounded-md p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/70"
                                  >
                                    <ChevronDown size={14} className="-rotate-90" />
                                  </button>
                                  <button
                                    onClick={() => delEvent(e.id)}
                                    className="rounded-md p-1.5 text-white/35 transition hover:bg-white/8 hover:text-red-400"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              {Object.entries(e.payload).length > 0 && (
                                <div className="rounded-sm border border-white/5 bg-[#0b1019] p-2">
                                  <p className="text-[9px] font-mono text-white/30 mb-1">Payload:</p>
                                  <div className="space-y-1">
                                    {Object.entries(e.payload)
                                      .slice(0, 2)
                                      .map(([key, val]) => (
                                        <div key={key} className="text-[10px] font-mono text-white/40">
                                          <span className="text-purple-400">{key}</span>
                                          <span className="text-white/15">: </span>
                                          <span className="text-white/30">{val}</span>
                                        </div>
                                      ))}
                                    {Object.entries(e.payload).length > 2 && (
                                      <div className="text-[10px] text-white/20">
                                        +{Object.entries(e.payload).length - 2} more fields
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <p
                        className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      >
                        Authentication Flow
                      </p>
                      <div className="rounded-md border border-white/8 bg-white/2 p-5 flex flex-col gap-5">
                        {/* Type */}
                        <div className="flex flex-col gap-2">
                          <p
                            className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                            style={{ fontFamily: "'Roboto', sans-serif" }}
                          >
                            Auth Type
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {authTypes.map((t) => {
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
                                  className="flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-[11px] font-bold tracking-[0.08em] transition-all duration-200"
                                  style={
                                    active
                                      ? {
                                          background: `${color}15`,
                                          borderColor: `${color}30`,
                                          color,
                                        }
                                      : {
                                          background: "rgba(255,255,255,0.04)",
                                          borderColor: "rgba(255,255,255,0.08)",
                                          color: "rgba(255,255,255,0.35)",
                                        }
                                  }
                                >
                                  <Icon size={12} />
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                          <p
                            className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                            style={{ fontFamily: "'Roboto', sans-serif" }}
                          >
                            Description
                          </p>
                          <div className="rounded-md border border-white/8 bg-[#0b1019] p-3">
                            <EditField
                              value={api.auth.description}
                              onChange={(v) =>
                                setApi((p) => ({
                                  ...p,
                                  auth: { ...p.auth, description: v },
                                }))
                              }
                              placeholder="Describe the auth strategy..."
                              className="text-sm text-white/50"
                            />
                          </div>
                        </div>

                        {/* Protected routes */}
                        <div className="flex flex-col gap-2">
                          <p
                            className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25"
                            style={{ fontFamily: "'Roboto', sans-serif" }}
                          >
                            Protected Routes
                          </p>
                          <div className="space-y-1.5">
                            {api.auth.routes.map((r, i) => (
                              <div key={i} className="flex items-center gap-2 group">
                                <ArrowRight size={10} className="text-orange-500/35 shrink-0" />
                                <code className="flex-1 text-[12px] font-mono text-white/50">
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
                                    placeholder="/api/v1/..."
                                    mono
                                    className="text-white/50"
                                  />
                                </code>
                                <button
                                  onClick={() =>
                                    setApi((p) => ({
                                      ...p,
                                      auth: {
                                        ...p.auth,
                                        routes: p.auth.routes.filter((_, j) => j !== i),
                                      },
                                    }))
                                  }
                                  className="rounded-md p-1 text-white/25 transition hover:bg-white/8 hover:text-red-400"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
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
                              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65 transition hover:border-white/20 hover:text-white/85 w-fit"
                            >
                              <Plus size={10} />
                              Add Route
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
            <motion.div
              variants={fadeUp(4)}
              className="flex flex-col items-center text-center gap-4 border border-dashed border-white/8 rounded-md py-16 px-4"
            >
              <div className="w-12 h-12 rounded-md bg-orange-500/8 border border-orange-500/15 flex items-center justify-center">
                <Code2 size={20} className="text-orange-500/40" />
              </div>
              <div className="flex flex-col gap-1">
                <p
                  className="text-sm font-bold text-white/40"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  No API defined yet
                </p>
                <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                  Click "Show API Fields" above or use the AI Copilot to generate your API structure.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <AIRightSidebar
        onApplySuggestion={applyAI}
        projectDescription="Design your API endpoints, WebSocket events, and authentication flow."
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
      />

      <RouteModal
        route={editingRoute}
        isOpen={routeModalOpen}
        onClose={() => { setRouteModalOpen(false); setEditingRoute(null); }}
        onSave={saveRoute}
      />

      <WsModal
        event={editingWs}
        isOpen={wsModalOpen}
        onClose={() => { setWsModalOpen(false); setEditingWs(null); }}
        onSave={saveEvent}
      />
    </div>
  );
}