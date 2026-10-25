import type {
  ApiContent,
  ApiRoute,
  HttpMethod,
  RealtimeEvent,
} from "./schemas/api.schema";

export type {
  ApiAuthFlow,
  ApiContent,
  ApiRoute,
  HttpMethod,
  RealtimeEvent,
} from "./schemas/api.schema";

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

const normalizeAuthRequired = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const normalizeAuthType = (value: unknown): string => {
  const raw = String(value ?? "JWT");
  const upper = raw.toUpperCase();
  if (upper.includes("JWT") || upper.includes("BEARER") || upper.includes("TOKEN")) {
    return "JWT";
  }
  if (upper.includes("OAUTH")) return "OAuth";
  if (upper.includes("SESSION") || upper.includes("COOKIE")) return "Session";
  return raw;
};

const normalizeResponse = (value: unknown): ApiRoute["response"] => {
  if (value === undefined || value === null) return { success: {} };

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    "success" in (value as Record<string, unknown>)
  ) {
    return {
      success: (value as Record<string, unknown>).success ?? {},
    };
  }

  return { success: value };
};

const normalizeRequest = (value: unknown): ApiRoute["request"] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const request: NonNullable<ApiRoute["request"]> = {};

  if ("body" in record) request.body = record.body;
  if ("params" in record) request.params = record.params;
  if ("query" in record) request.query = record.query;

  return Object.keys(request).length > 0 ? request : undefined;
};

const normalizeRoute = (value: unknown): ApiRoute => {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    name: typeof record.name === "string" ? record.name : "Endpoint",
    method: normalizeMethod(record.method),
    path: typeof record.path === "string" ? record.path : "/",
    description:
      typeof record.description === "string" ? record.description : "",
    request: normalizeRequest(record.request),
    response: normalizeResponse(record.response),
    authRequired: normalizeAuthRequired(record.authRequired),
  };
};

const normalizeRealtime = (value: unknown): RealtimeEvent => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object") {
        return normalizeRealtime(parsed);
      }
    } catch {
      // Not JSON; treat the string as the event name.
    }

    return { name: value, description: value, payload: {} };
  }

  if (!value || typeof value !== "object") {
    return { name: "event", description: "", payload: {} };
  }

  const record = value as Record<string, unknown>;

  return {
    name: typeof record.name === "string" ? record.name : "event",
    description:
      typeof record.description === "string" ? record.description : "",
    payload: record.payload ?? {},
  };
};

export const normalizeApi = (payload: unknown): ApiContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  const authRecord =
    source.auth && typeof source.auth === "object"
      ? (source.auth as Record<string, unknown>)
      : {};

  return {
    rest: Array.isArray(source.rest) ? source.rest.map(normalizeRoute) : [],
    realtime: Array.isArray(source.realtime)
      ? source.realtime.map(normalizeRealtime)
      : [],
    auth: {
      type: normalizeAuthType(authRecord.type),
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

const schemaFromValue = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length > 0 ? schemaFromValue(value[0]) : {},
    };
  }

  if (value === null) return { nullable: true };

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: Number.isInteger(value) ? "integer" : "number" };
    case "boolean":
      return { type: "boolean" };
    case "object":
      return {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, item]) => [
            key,
            schemaFromValue(item),
          ]),
        ),
      };
    default:
      return {};
  }
};

const objectEntries = (value: unknown): Array<[string, unknown]> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value as Record<string, unknown>)
    : [];

const securityForAuth = (type: string) => {
  const normalized = normalizeAuthType(type);
  if (normalized === "OAuth") return "oauth2";
  if (normalized === "Session") return "sessionAuth";
  return "bearerAuth";
};

export const buildOpenApi = (content: ApiContent) => {
  const authScheme = securityForAuth(content.auth.type);

  return {
    openapi: "3.0.0",
    info: {
      title: "Planex API",
      version: "1.0.0",
      description: content.auth.description,
    },
    paths: Object.fromEntries(
      content.rest.map((route) => {
        const params = objectEntries(route.request?.params).map(
          ([name, value]) => ({
            name,
            in: "path",
            required: true,
            schema: schemaFromValue(value),
          }),
        );
        const query = objectEntries(route.request?.query).map(
          ([name, value]) => ({
            name,
            in: "query",
            required: false,
            schema: schemaFromValue(value),
          }),
        );
        const hasBody = route.request?.body !== undefined;
        const success = route.response?.success;

        return [
          route.path,
          {
            [route.method.toLowerCase()]: {
              summary: route.name,
              description: route.description,
              ...(route.authRequired
                ? { security: [{ [authScheme]: [] }] }
                : {}),
              ...(params.length > 0 || query.length > 0
                ? { parameters: [...params, ...query] }
                : {}),
              ...(hasBody
                ? {
                    requestBody: {
                      required: true,
                      content: {
                        "application/json": {
                          schema: schemaFromValue(route.request?.body),
                          example: route.request?.body,
                        },
                      },
                    },
                  }
                : {}),
              responses: {
                "200": {
                  description: "Success",
                  ...(success !== undefined
                    ? {
                        content: {
                          "application/json": {
                            schema: schemaFromValue(success),
                            example: success,
                          },
                        },
                      }
                    : {}),
                },
                ...(route.authRequired
                  ? { "401": { description: "Unauthorized" } }
                  : {}),
                ...(hasBody || params.length > 0 || query.length > 0
                  ? { "422": { description: "Validation error" } }
                  : {}),
              },
            },
          },
        ];
      }),
    ),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        oauth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: "/oauth/authorize",
              tokenUrl: "/oauth/token",
              scopes: {},
            },
          },
        },
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session",
        },
      },
    },
    "x-auth": {
      type: content.auth.type,
      description: content.auth.description,
      routes: content.auth.routes,
    },
    "x-realtime-events": content.realtime.map((event) => ({
      name: event.name,
      description: event.description,
      payload: event.payload,
    })),
  };
};
