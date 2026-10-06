import axios, { type InternalAxiosRequestConfig } from "axios";

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;
let refreshFailed = false;

/**
 * Remove only the auth tokens. Avoid localStorage.clear() so unrelated app
 * state (theme, cached core location/device IDs) survives a session expiry.
 */
export function clearAuthTokens() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
}

const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
    timeout: 10000, // 10 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

/** Shared by Axios requests and fetch-based streaming requests. */
export function expireAuthSession() {
    clearAuthTokens();
    if (!window.location.pathname.includes("/auth/login")) {
        window.location.href = "/auth/login";
    }
}

export async function refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshFailed || !refreshToken) {
        expireAuthSession();
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
                    { refresh_token: refreshToken },
                    { timeout: 10000 },
                );
                localStorage.setItem("authToken", data.access_token);
                localStorage.setItem("refreshToken", data.refresh_token);
                refreshFailed = false;
                return { accessToken: data.access_token, refreshToken: data.refresh_token };
            } catch {
                refreshFailed = true;
                expireAuthSession();
                throw new Error("Your session has expired. Please sign in again.");
            } finally {
                refreshPromise = null;
            }
        })();
    }
    const tokens = await refreshPromise;
    return tokens.accessToken;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && original && !original._retry) {
            original._retry = true;
            const token = await refreshAccessToken();
            original.headers.Authorization = `Bearer ${token}`;
            return apiClient(original);
        }
        return Promise.reject(error);
    },
);

export function resetRefreshState() {
    refreshFailed = false;
}

export default apiClient;
