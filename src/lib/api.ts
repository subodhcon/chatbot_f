const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://chatbotb-production.up.railway.app/api/v1";
const API_URL = rawApiUrl.replace(/^['"]|['"]$/g, "").trim();

// Debug: log the API URL in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[API] Using URL:", API_URL);
}

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    is_active: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details: unknown;
  } | null;
}

export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
};

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function loginUser(email: string, password: string): Promise<ApiResponse<LoginResponseData>> {
  const MAX_RETRIES = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        20000
      );

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP Error ${response.status}`);
      }

      if (!response.ok) {
        let errMsg = "Authentication failed";
        if (data && typeof data.detail === "string") {
          errMsg = data.detail;
        } else if (data && Array.isArray(data.detail)) {
          errMsg = data.detail.map((d: any) => d.msg).join(", ");
        } else if (data && data.error?.message) {
          errMsg = data.error.message;
        }

        return {
          success: false,
          data: null,
          error: {
            code: data?.error?.code || `HTTP_${response.status}`,
            message: errMsg,
            details: data,
          },
        };
      }

      return data;
    } catch (error: unknown) {
      lastError = error;
      const errString = String(error);

      if (errString.includes("AbortError") || errString.includes("abort")) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
    }
  }

  const errString = String(lastError);
  let message = "Unable to reach the server. Please check your internet connection.";
  let code = "CONNECTION_FAILED";

  if (errString.includes("AbortError") || errString.includes("abort")) {
    message = "Request timed out. Please try again.";
    code = "TIMEOUT";
  } else if (errString.includes("Failed to fetch") || errString.includes("TypeError") || errString.includes("NetworkError")) {
    message = "Network error. Please check your internet connection and try again.";
    code = "NETWORK_ERROR";
  } else if (lastError instanceof Error) {
    message = lastError.message;
  }

  return {
    success: false,
    data: null,
    error: { code, message, details: lastError },
  };
}

export async function registerUser(
  email: string,
  name: string,
  password: string
): Promise<ApiResponse<unknown>> {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          code: data.error?.code || "HTTP_ERROR",
          message: data.error?.message || "Registration failed",
          details: data.error?.details || null,
        },
      };
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "A network error occurred. Please try again.";
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message,
        details: error,
      },
    };
  }
}

export async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const accessToken = getAccessToken();
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    // Helper to safely parse JSON response
    const safeParse = async (res: Response) => {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
      const text = await res.text();
      return {
        success: false,
        data: null,
        error: {
          code: `HTTP_${res.status}`,
          message: text.substring(0, 150) || `HTTP Error ${res.status}`,
          details: null,
        }
      };
    };

    // Handle 401 token refresh scenario
    if (response.status === 401) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await safeParse(refreshResponse);
          if (refreshData.success && refreshData.data) {
            setTokens(refreshData.data.access_token, refreshData.data.refresh_token);
            // Retry the original request
            headers["Authorization"] = `Bearer ${refreshData.data.access_token}`;
            const retryResponse = await fetch(`${API_URL}${url}`, {
              ...options,
              headers,
            });
            return await safeParse(retryResponse);
          }
        }
      }
      
      // If refresh failed or was absent, clear tokens
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return await safeParse(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "API request failed";
    return {
      success: false,
      data: null,
      error: {
        code: "REQUEST_FAILED",
        message,
        details: error,
      },
    };
  }
}
