import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseUrl ? rawBaseUrl.replace(/\/$/, "") : "";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    const responseData = error?.response?.data;
    const responseText = typeof responseData === "string" ? responseData : "";
    const contentType = error?.response?.headers?.["content-type"] ?? "";
    const isProxyFailure =
      error?.response?.status === 500 &&
      (responseText.includes("ECONNREFUSED") ||
        responseText.includes("proxy") ||
        contentType.includes("text/html"));

    if (error?.code === "ERR_NETWORK" || isProxyFailure) {
      return Promise.reject(
        new Error("Unable to reach the API. Make sure the backend server is running and reachable.")
      );
    }

    return Promise.reject(error);
  }
);