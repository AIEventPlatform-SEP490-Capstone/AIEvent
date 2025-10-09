import axios from "axios";
import Cookies from "js-cookie";
import { showError, apiMessages } from "../lib/toastUtils";

const BASE_URL = '/api';

const fetcher = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
const MAX_QUEUE_SIZE = 50;

const processQueue = (error, token = null) => {
  if (failedQueue.length >= MAX_QUEUE_SIZE) {
    failedQueue = failedQueue.slice(-MAX_QUEUE_SIZE);
  }
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

fetcher.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

fetcher.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === "ECONNABORTED") {
      showError(apiMessages.timeout);
      return Promise.reject(error);
    }

    if (error.message.includes("Network Error")) {
      showError(apiMessages.networkError);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Không refresh token cho login request hoặc refresh token request
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => fetcher(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await fetcher.post("/auth/refresh-token");
        const { data } = refreshResponse.data;

        Cookies.set("accessToken", data.accessToken, {
          expires: new Date(data.expiresAt),
          secure: true,
          sameSite: 'strict',
        });

        isRefreshing = false;
        processQueue(null);
        return fetcher(originalRequest);
      } catch (refreshError) {
        showError("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");

        localStorage.removeItem("currentUser");
        Cookies.remove("accessToken");

        isRefreshing = false;
        processQueue(refreshError);

        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 100);

        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const status = error.response.status;
      // Không hiển thị toast tự động - để component xử lý
      // Chỉ log error để debug
      console.error('API Error:', status, error.response.data);
    }

    return Promise.reject(error);
  }
);

// API Functions
export const authAPI = {
  login: async (credentials) => {
    const response = await fetcher.post('/auth/login', credentials);
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await fetcher.post('/auth/refresh-token');
    return response.data;
  },
  
  logout: async () => {
    const response = await fetcher.post('/auth/revoke-token');
    return response.data;
  },
};

export default fetcher;