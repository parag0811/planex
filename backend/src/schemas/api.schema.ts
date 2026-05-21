import { z } from "zod";

const HttpMethod = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const ApiRouteSchema = z.object({
  name: z.string(),
  method: z.enum(HttpMethod),
  path: z.string(),
  description: z.string(),
  request: z
    .object({
      body: z.record(z.string(), z.string()).optional(),
      params: z.record(z.string(), z.string()).optional(),
      query: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  response: z.object({
    success: z.record(z.string(), z.string()),
  }),
  authRequired: z.boolean(),
});

const WebSocketEventSchema = z.object({
  name: z.string(),
  description: z.string(),
  payload: z.record(z.string(), z.string()),
});

const AuthFlowType = ["JWT", "OAuth", "Session"] as const;

const AuthFlowSchema = z.object({
  type: z.enum(AuthFlowType),
  description: z.string(),
  routes: z.array(z.string()),
});

const ApiSectionContentSchema = z.object({
  rest: z.array(ApiRouteSchema),
  realtime: z.array(WebSocketEventSchema).optional(),
  auth: AuthFlowSchema,
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
