import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,
});

/** Fired on 403 so the admin shell can tell the user (and refresh permissions). */
export const ADMIN_FORBIDDEN_EVENT = "admin:forbidden";

// Requests whose 401 is an expected answer, not an expired session.
const AUTH_ENDPOINTS = ["/signin", "/auth/status", "/auth/me/password"];

const isAuthEndpoint = (url?: string) =>
  !!url && AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

/** `/ka/admin/...` → `{ locale: "ka", isAdmin: true }` */
const parseLocation = () => {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return {
    locale: segments[0] ?? "ka",
    isAdmin: segments[1] === "admin",
    isAdminLogin: segments[1] === "admin" && segments[2] === "login",
  };
};

axiosInstance.interceptors.request.use(
  (config) => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {
      token = null;
    }

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const url: string | undefined = error.config?.url;

    if (status === 401 && !isAuthEndpoint(url)) {
      try {
        localStorage.removeItem("token");
      } catch {
        // ignore
      }
      const { locale, isAdmin, isAdminLogin } = parseLocation();
      // Only the back-office needs a session; public pages just drop the stale token.
      if (isAdmin && !isAdminLogin) {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.assign(`/${locale}/admin/login?next=${next}&expired=1`);
      }
    }

    if (status === 403 && parseLocation().isAdmin) {
      window.dispatchEvent(new CustomEvent(ADMIN_FORBIDDEN_EVENT));
    }

    return Promise.reject(error);
  }
);
