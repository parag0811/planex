import { z } from "zod";

const HttpMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const ApiRouteSchema = z.object({
  name: z.string(),
  method: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(HttpMethod)),
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
      z.any().transform((v) => ({ success: v })),
    ])
    .optional()
    .default({ success: {} }),
  authRequired: z
    .union([
      z.boolean(),
      z.string().transform((v) => v.toLowerCase() === "true"),
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
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        return { name: val, description: val, payload: {} };
      }
    })
    .pipe(WebSocketEventObjectSchema),
  z.any().transform((val) => ({
    name: String(val?.name || "event"),
    description: String(val?.description || ""),
    payload: val?.payload || {},
  })),
]);

const AuthFlowSchema = z.object({
  type: z.string().transform((val) => {
    const upper = String(val).toUpperCase();
    if (
      upper.includes("JWT") ||
      upper.includes("BEARER") ||
      upper.includes("TOKEN")
    )
      return "JWT";
    if (upper.includes("OAUTH")) return "OAuth";
    if (upper.includes("SESSION") || upper.includes("COOKIE")) return "Session";
    return val;
  }),
  description: z.string().optional().default("Authentication configuration"),
  routes: z.array(z.string()).optional().default([]),
});

const ApiSectionContentSchema = z.object({
  rest: z.array(ApiRouteSchema),
  realtime: z.array(WebSocketEventSchema).optional().default([]),
  auth: AuthFlowSchema.optional().default({
    type: "JWT",
    description: "JWT Authentication",
    routes: ["/api/v1/auth/login"],
  }),
});

const ApiPromptOptionsSchema = z.object({
  isRegenerating: z.boolean().optional(),
  regenerationSeed: z.string().optional(),
  instruction: z.string().optional(),
});

export {
  ApiRouteSchema,
  WebSocketEventSchema,
  AuthFlowSchema,
  ApiSectionContentSchema,
  ApiPromptOptionsSchema,
};
