export type PageId = 
  | "billing" 
  | "orders" 
  | "kitchen" 
  | "menu" 
  | "sales" 
  | "settings";

export type UserRole = "Owner" | "Staff";

export type AppRole = "owner" | "cashier" | "waiter" | "chef";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: AppRole;
  displayRoleName: string;
  allowedPages: PageId[];
  defaultPage: PageId;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string | null;
  vegNonVeg?: "Veg" | "Non-Veg";
  availability?: boolean;
}


export interface BillDetail {
  itemId: number;
  itemName: string;
  price: number;
  quantity: number;
}

export interface Bill {
  billNo: string;
  customerName: string;
  customerWhatsapp?: string;
  items: BillDetail[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  date: string; // YYYY-MM-DD
  timestamp: string; // HH:MM AM/PM
  status: "Printed" | "Sent" | "Pending" | "Saved";
}

export interface StaffAccount {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  displayRoleName: string;
  active: boolean;
  createdAt: string;
}
