const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

export async function loginUser(email: string, password: string): Promise<ApiResponse<LoginResponseData>> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          code: data.error?.code || "HTTP_ERROR",
          message: data.error?.message || "Authentication failed",
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
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data) {
            setTokens(refreshData.data.access_token, refreshData.data.refresh_token);
            // Retry the original request
            headers["Authorization"] = `Bearer ${refreshData.data.access_token}`;
            const retryResponse = await fetch(`${API_URL}${url}`, {
              ...options,
              headers,
            });
            return await retryResponse.json();
          }
        }
      }
      
      // If refresh failed or was absent, clear tokens
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return await response.json();
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
