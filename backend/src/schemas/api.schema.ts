export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRoute {
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  request?: {
    body?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  };
  response: {
    success: Record<string, string>;
  };
  authRequired: boolean;
}

export interface WebSocketEvent {
  name: string;
  description: string;
  payload: Record<string, string>;
}

export interface AuthFlow {
  type: "JWT" | "OAuth" | "Session";
  description: string;
  routes: string[];
}

export interface ApiSectionContent {
  rest: ApiRoute[];
  realtime?: WebSocketEvent[];
  auth: AuthFlow;
}

export interface ApiPromptOptions {
  isRegenerating?: boolean;
  regenerationSeed?: string;
  instruction?: string;
}