import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// res inter -> handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPage =
      pathname.includes("/login") ||
      pathname.includes("/register") ||
      pathname.includes("/oauth-callback");
    const headers = error.config?.headers;
    const requestHadToken = Boolean(
      headers?.Authorization || headers?.authorization,
    );

    if (error.response?.status === 401 && requestHadToken && !isAuthPage) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default axiosInstance