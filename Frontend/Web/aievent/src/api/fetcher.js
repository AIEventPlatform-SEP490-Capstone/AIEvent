import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetcher = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
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
      toast.error("Connection timed out. Please try again!");
      return Promise.reject(error);
    }

    if (error.message === "Network Error") {
      toast.error("Network error. Please check your connection!");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        await fetcher.post("/auth/refresh-token");
        isRefreshing = false;
        processQueue(null);
        return fetcher(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired. Please log in again.");

        localStorage.removeItem("currentUser");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");

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
      if (status === 500) toast.error("Server error!");
      else if (status === 403) toast.error("Access denied!");
    }

    return Promise.reject(error);
  }
);

export default fetcher;