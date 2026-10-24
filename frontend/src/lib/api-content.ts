export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRoute {
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  request?: {
    body?: unknown;
    params?: unknown;
    query?: unknown;
  };
  response?: {
    success?: unknown;
  };
  authRequired?: boolean;
}

export interface ApiAuthFlow {
  type: string;
  description: string;
  routes: string[];
}

export interface RealtimeEvent {
  name: string;
  description: string;
  payload: unknown;
}

export interface ApiContent {
  rest: ApiRoute[];
  realtime: RealtimeEvent[];
  auth: ApiAuthFlow;
}

export const EMPTY_API: ApiContent = {
  rest: [],
  realtime: [],
  auth: {
    type: "JWT",
    description: "Bearer authentication",
    routes: [],
  },
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const normalizeMethod = (value: unknown): HttpMethod => {
  const method = String(value ?? "GET").toUpperCase();
  return (METHODS.includes(method as HttpMethod) ? method : "GET") as HttpMethod;
};

export const normalizeApi = (payload: unknown): ApiContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  const rest = Array.isArray(source.rest)
    ? source.rest
        .map((route) => {
          const record = route as Record<string, unknown>;
          return {
            name: typeof record.name === "string" ? record.name : "Endpoint",
            method: normalizeMethod(record.method),
            path: typeof record.path === "string" ? record.path : "/",
            description:
              typeof record.description === "string"
                ? record.description
                : "",
            request:
              record.request && typeof record.request === "object"
                ? (record.request as ApiRoute["request"])
                : undefined,
            response:
              record.response && typeof record.response === "object"
                ? (record.response as ApiRoute["response"])
                : undefined,
            authRequired: record.authRequired === true,
          };
        })
        .filter((route) => route.path)
    : [];

  const authRecord =
    source.auth && typeof source.auth === "object"
      ? (source.auth as Record<string, unknown>)
      : {};

  return {
    rest,
    realtime: Array.isArray(source.realtime)
      ? source.realtime.map((event) => {
          const record = event as Record<string, unknown>;
          return {
            name: typeof record.name === "string" ? record.name : "event",
            description:
              typeof record.description === "string"
                ? record.description
                : "",
            payload: record.payload ?? {},
          };
        })
      : [],
    auth: {
      type: typeof authRecord.type === "string" ? authRecord.type : "JWT",
      description:
        typeof authRecord.description === "string"
          ? authRecord.description
          : "Bearer authentication",
      routes: Array.isArray(authRecord.routes)
        ? authRecord.routes.filter(
            (route): route is string => typeof route === "string",
          )
        : [],
    },
  };
};

export const groupRoutes = (routes: ApiRoute[]) => {
  const groups = new Map<string, ApiRoute[]>();

  routes.forEach((route) => {
    const segment = route.path.includes("/votes")
      ? "votes"
      : (route.path.split("/").filter(Boolean)[0] ?? "general");
    const label =
      segment === "auth"
        ? "Auth"
        : segment.charAt(0).toUpperCase() + segment.slice(1);
    const existing = groups.get(label) ?? [];
    groups.set(label, [...existing, route]);
  });

  return Array.from(groups.entries()).map(([name, items]) => ({
    name,
    purpose: items[0]?.description ?? "",
    routes: items,
  }));
};

export const buildOpenApi = (content: ApiContent) => ({
  openapi: "3.0.0",
  info: {
    title: "Planex API",
    version: "1.0.0",
    description: content.auth.description,
  },
  servers: [{ url: "/api/v1" }],
  paths: Object.fromEntries(
    content.rest.map((route) => [
      route.path,
      {
        [route.method.toLowerCase()]: {
          summary: route.name,
          description: route.description,
          ...(route.authRequired
            ? { security: [{ bearerAuth: [] }] }
            : {}),
          ...(route.request?.body
            ? {
                requestBody: {
                  content: {
                    "application/json": {
                      schema: { type: "object" },
                    },
                  },
                },
              }
            : {}),
          responses: {
            "200": { description: "Success" },
            "401": { description: "Unauthorized" },
            "422": { description: "Validation error" },
          },
        },
      },
    ]),
  ),
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
});
