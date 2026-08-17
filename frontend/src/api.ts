import { io, Socket } from "socket.io-client";
import { AuthUser, MenuItem, Customer, Bill, StaffAccount, UserAccount } from "./types";

const API_BASE = "http://localhost:3000/api/v1";

// Centralized token getter/setter
export function getAccessToken(): string | null {
  return localStorage.getItem("secret_vibez_jwt_token");
}

export function saveAccessToken(token: string): void {
  localStorage.setItem("secret_vibez_jwt_token", token);
}

export function clearAccessToken(): void {
  localStorage.removeItem("secret_vibez_jwt_token");
}

// Global API request wrapper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired or unauthorized -> logout
    clearAccessToken();
    localStorage.removeItem("secret_vibez_auth_user");
    window.location.hash = "";
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errBody = await response.json();
      errorMessage = errBody.error || errBody.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// WebSocket Connection Setup
let socketInstance: Socket | null = null;

export function getSocketConnection(): Socket {
  if (!socketInstance) {
    socketInstance = io("http://localhost:3000", {
      auth: {
        token: getAccessToken()
      },
      transports: ["websocket"]
    });
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// -------------------------------------------------------------
// API Endpoints Mapping
// -------------------------------------------------------------

export const authApi = {
  login: async (credentials: any): Promise<{ accessToken: string; user: AuthUser }> => {
    const res = await request<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    saveAccessToken(res.accessToken);
    return res;
  },
  me: async (): Promise<AuthUser> => {
    return request<AuthUser>("/auth/me");
  }
};

export const menuApi = {
  list: async (): Promise<MenuItem[]> => {
    return request<MenuItem[]>("/menu");
  },
  create: async (data: Partial<MenuItem>): Promise<MenuItem> => {
    return request<MenuItem>("/menu", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  update: async (id: number, data: Partial<MenuItem>): Promise<MenuItem> => {
    return request<MenuItem>(`/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  toggleAvailability: async (id: number, availability: boolean): Promise<MenuItem> => {
    return request<MenuItem>(`/menu/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ availability })
    });
  },
  delete: async (id: number): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/menu/${id}`, {
      method: "DELETE"
    });
  }
};

export const categoryApi = {
  list: async (): Promise<any[]> => {
    return request<any[]>("/categories");
  },
  create: async (name: string): Promise<any> => {
    return request<any>("/categories", {
      method: "POST",
      body: JSON.stringify({ name })
    });
  },
  delete: async (id: number): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/categories/${id}`, {
      method: "DELETE"
    });
  }
};

export const tableApi = {
  list: async (): Promise<any[]> => {
    return request<any[]>("/tables");
  },
  create: async (data: any): Promise<any> => {
    return request<any>("/tables", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  update: async (id: number, data: any): Promise<any> => {
    return request<any>(`/tables/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  updateStatus: async (id: number, status: string): Promise<any> => {
    return request<any>(`/tables/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }
};

export const orderApi = {
  list: async (filters: { status?: string; tableId?: number } = {}): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.tableId) params.append("tableId", String(filters.tableId));
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<any[]>(`/orders${query}`);
  },
  get: async (id: number): Promise<any> => {
    return request<any>(`/orders/${id}`);
  },
  create: async (data: any): Promise<any> => {
    return request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  updateStatus: async (id: number, status: string): Promise<any> => {
    return request<any>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },
  requestBill: async (id: number): Promise<any> => {
    return request<any>(`/orders/${id}/request-bill`, {
      method: "POST",
      body: "{}"
    });
  }
};

export const billApi = {
  getQueue: async (): Promise<any[]> => {
    return request<any[]>("/bills/queue");
  },
  get: async (id: number): Promise<any> => {
    return request<any>(`/bills/${id}`);
  },
  payment: async (id: number, data: { paymentMethod: string; discount: number }): Promise<any> => {
    return request<any>(`/bills/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  complete: async (id: number): Promise<any> => {
    return request<any>(`/bills/${id}/complete`, {
      method: "POST",
      body: "{}"
    });
  }
};

export const paymentApi = {
  create: async (data: { orderId: number; amount: number; paymentMethod: string }): Promise<any> => {
    return request<any>("/payments", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
};

export const customerApi = {
  list: async (query?: string): Promise<Customer[]> => {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return request<Customer[]>(`/customers${q}`);
  },
  create: async (data: Partial<Customer>): Promise<Customer> => {
    return request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  get: async (id: number): Promise<any> => {
    return request<any>(`/customers/${id}`);
  }
};

export const dashboardApi = {
  get: async (): Promise<any> => {
    return request<any>("/dashboard");
  }
};

export const reportsApi = {
  getSales: async (filters: { range: string; startDate?: string; endDate?: string }): Promise<any> => {
    const params = new URLSearchParams();
    params.append("range", filters.range);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    return request<any>(`/reports/sales?${params.toString()}`);
  }
};

export const settingsApi = {
  get: async (): Promise<any> => {
    return request<any>("/settings");
  },
  update: async (data: any): Promise<any> => {
    return request<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
};

export const userApi = {
  list: async (): Promise<UserAccount[]> => {
    return request<UserAccount[]>("/users");
  },
  get: async (id: number): Promise<UserAccount> => {
    return request<UserAccount>(`/users/${id}`);
  },
  create: async (data: any): Promise<UserAccount> => {
    return request<UserAccount>("/users", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  update: async (id: number, data: any): Promise<UserAccount> => {
    return request<UserAccount>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },
  updateStatus: async (id: number, active: boolean): Promise<UserAccount> => {
    return request<UserAccount>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active })
    });
  },
  resetPassword: async (id: number, data: any): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "DELETE"
    });
  }
};
