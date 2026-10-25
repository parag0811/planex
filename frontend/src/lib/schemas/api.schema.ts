import { z } from "zod";

/**
 * Mirrors backend/src/schemas/api.schema.ts. Keep both in sync.
 */

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

const HttpMethodSchema = z
  .string()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(HTTP_METHODS));

const ApiRouteSchema = z.object({
  name: z.string(),
  method: HttpMethodSchema,
  path: z.string(),
  description: z.string().optional().default(""),
  request: z
    .object({
      body: z.any().optional(),
      params: z.any().optional(),
      query: z.any().optional(),
    })
    .optional(),
  response: z
    .union([
      z.object({
        success: z.any().optional().default({}),
      }),
      z.any().transform((value) => ({ success: value })),
    ])
    .optional()
    .default({ success: {} }),
  authRequired: z
    .union([
      z.boolean(),
      z.string().transform((value) => value.toLowerCase() === "true"),
    ])
    .optional()
    .default(false),
});

const WebSocketEventObjectSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""),
  payload: z.any().optional().default({}),
});

const WebSocketEventSchema = z.union([
  WebSocketEventObjectSchema,
  z
    .string()
    .transform((value) => {
      try {
        return JSON.parse(value);
      } catch {
        return { name: value, description: value, payload: {} };
      }
    })
    .pipe(WebSocketEventObjectSchema),
  z.any().transform((value) => ({
    name: String(value?.name || "event"),
    description: String(value?.description || ""),
    payload: value?.payload || {},
  })),
]);

const AuthFlowSchema = z.object({
  type: z.string().transform((value) => {
    const upper = String(value).toUpperCase();
    if (
      upper.includes("JWT") ||
      upper.includes("BEARER") ||
      upper.includes("TOKEN")
    ) {
      return "JWT";
    }
    if (upper.includes("OAUTH")) return "OAuth";
    if (upper.includes("SESSION") || upper.includes("COOKIE")) return "Session";
    return value;
  }),
  description: z.string().optional().default("Authentication configuration"),
  routes: z.array(z.string()).optional().default([]),
});

export const ApiSectionContentSchema = z.object({
  rest: z.array(ApiRouteSchema),
  realtime: z.array(WebSocketEventSchema).optional().default([]),
  auth: AuthFlowSchema.optional().default({
    type: "JWT",
    description: "JWT Authentication",
    routes: ["/api/v1/auth/login"],
  }),
});

export type ApiRoute = z.infer<typeof ApiRouteSchema>;
export type ApiAuthFlow = z.infer<typeof AuthFlowSchema>;
export type RealtimeEvent = z.infer<typeof WebSocketEventObjectSchema>;
export type ApiContent = z.infer<typeof ApiSectionContentSchema>;

/**
 * Structural validation matches the backend. The editor adds the rules needed
 * to produce a usable API contract.
 */
export const ApiEditorSchema = ApiSectionContentSchema.superRefine(
  (value, ctx) => {
    if (value.rest.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["rest"],
        message: "Add at least one endpoint.",
      });
    }

    const routeKeys = new Set<string>();

    value.rest.forEach((route, index) => {
      if (!route.name.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["rest", index, "name"],
          message: "Add an endpoint name.",
        });
      }

      if (!route.path.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["rest", index, "path"],
          message: "Add an endpoint path.",
        });
      } else if (!route.path.trim().startsWith("/")) {
        ctx.addIssue({
          code: "custom",
          path: ["rest", index, "path"],
          message: "Paths must start with /.",
        });
      } else {
        const key = `${route.method} ${route.path.trim().toLowerCase()}`;
        if (routeKeys.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["rest", index, "path"],
            message: "This method and path already exists.",
          });
        } else {
          routeKeys.add(key);
        }
      }
    });

    const eventNames = new Set<string>();

    value.realtime.forEach((event, index) => {
      if (!event.name.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["realtime", index, "name"],
          message: "Add an event name.",
        });
      } else {
        const key = event.name.trim().toLowerCase();
        if (eventNames.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["realtime", index, "name"],
            message: "Event names must be unique.",
          });
        } else {
          eventNames.add(key);
        }
      }
    });

    if (!value.auth.type.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["auth", "type"],
        message: "Choose an authentication type.",
      });
    }

    value.auth.routes.forEach((route, index) => {
      if (!route.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["auth", "routes", index],
          message: "Remove this empty route or add a value.",
        });
      }
    });
  },
);

export type ApiFieldErrors = Record<string, string>;

export const getApiFieldErrors = (error: z.ZodError): ApiFieldErrors => {
  const errors: ApiFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
