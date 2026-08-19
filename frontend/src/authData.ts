import { AuthUser, PageId } from "./types";

export interface MockAccountConfig extends AuthUser {
  password: string;
}

export const MOCK_ACCOUNTS: MockAccountConfig[] = [
  {
    id: 1,
    email: "admin@secretvibez.com",
    password: "admin0987654321",
    name: "Rajesh Kumar",
    role: "owner",
    displayRoleName: "Owner",
    allowedPages: ["billing", "orders", "kitchen", "menu", "sales", "settings"],
    defaultPage: "billing"
  },
  {
    id: 2,
    email: "cashier@secretvibez.com",
    password: "Cashier@123",
    name: "Amit Sharma",
    role: "cashier",
    displayRoleName: "Cashier",
    allowedPages: ["billing"],
    defaultPage: "billing"
  },
  {
    id: 3,
    email: "waiter@secretvibez.com",
    password: "Waiter@123",
    name: "Gladina Samantha",
    role: "waiter",
    displayRoleName: "Waiters",
    allowedPages: ["orders"],
    defaultPage: "orders"
  },
  {
    id: 4,
    email: "chef@secretvibez.com",
    password: "Chef@123",
    name: "Ramesh Chef",
    role: "chef",
    displayRoleName: "Chef",
    allowedPages: ["kitchen"],
    defaultPage: "kitchen"
  }
];

const AUTH_STORAGE_KEY = "secret_vibez_auth_user";

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (err) {
    console.error("Failed to load auth user from storage", err);
    return null;
  }
}

export function saveStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Failed to save auth user to storage", err);
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear auth user from storage", err);
  }
}

export function isPageAllowed(user: AuthUser | null, page: PageId): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  return user.allowedPages.includes(page);
}
