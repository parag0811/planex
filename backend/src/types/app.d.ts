declare global {
  interface AppError extends Error {
    status?: number;
    fieldErrors?: Record<string, string>;
    code?: string;
  }

  interface ApiResponse<T = any> {
    message: string;
    data?: T;
  }
}

export { };
