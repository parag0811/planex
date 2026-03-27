interface AppError extends Error {
  status?: number;
}

interface ApiResponse<T = any> {
  message: string;
  data?: T;
}
