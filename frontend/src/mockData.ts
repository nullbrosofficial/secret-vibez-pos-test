import { MenuItem, Customer, Bill, StaffAccount } from "./types";

export const INITIAL_CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts"];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 1, name: "Veg Spring Roll", category: "Starters", price: 120 },
  { id: 2, name: "Paneer Tikka", category: "Starters", price: 180 },
  { id: 3, name: "Butter Chicken", category: "Main Course", price: 280 },
  { id: 4, name: "Dal Makhani", category: "Main Course", price: 200 },
  { id: 5, name: "Garlic Naan", category: "Main Course", price: 40 },
  { id: 6, name: "Mango Lassi", category: "Beverages", price: 80 },
  { id: 7, name: "Masala Chai", category: "Beverages", price: 30 },
  { id: 8, name: "Gulab Jamun", category: "Desserts", price: 60 },
  { id: 9, name: "Rasgulla", category: "Desserts", price: 60 },
  { id: 10, name: "Tandoori Roti", category: "Main Course", price: 30 },
  { id: 11, name: "Chow Mein", category: "Starters", price: 140 },
  { id: 12, name: "Kulfi Falooda", category: "Desserts", price: 90 }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: "Arjun Sharma", whatsapp: "9876543210", visits: 14, spent: 4820, birthday: "1990-03-15" },
  { id: 2, name: "Priya Nair", whatsapp: "9845012345", visits: 7, spent: 2100, birthday: "1995-07-22" },
  { id: 3, name: "Ravi Kumar", whatsapp: "9901234567", visits: 22, spent: 7300, birthday: "1988-11-05" },
  { id: 4, name: "Meena Patel", whatsapp: "9712345678", visits: 3, spent: 850, birthday: "2000-01-30" },
  { id: 5, name: "Suresh Babu", whatsapp: "9632145870", visits: 11, spent: 3600, birthday: "1982-09-18" },
  { id: 6, name: "Rohan Verma", whatsapp: "9820123456", visits: 8, spent: 2450, birthday: "1993-04-12" },
  { id: 7, name: "Aditi Rao", whatsapp: "9510293847", visits: 5, spent: 1540, birthday: "1997-12-05" },
  { id: 8, name: "Vikram Singh", whatsapp: "9123456789", visits: 18, spent: 5900, birthday: "1985-05-25" },
  { id: 9, name: "Neha Gupta", whatsapp: "9818273645", visits: 12, spent: 4100, birthday: "1991-08-09" }
];

export const INITIAL_BILLS: Bill[] = [
  {
    billNo: "BILL-0041",
    customerName: "Arjun Sharma",
    customerWhatsapp: "9876543210",
    items: [
      { itemId: 3, itemName: "Butter Chicken", price: 280, quantity: 1 },
      { itemId: 2, itemName: "Paneer Tikka", price: 180, quantity: 1 },
      { itemId: 7, itemName: "Masala Chai", price: 30, quantity: 2 }
    ],
    subtotal: 520,
    tax: 26,
    grandTotal: 546,
    date: "2026-05-22",
    timestamp: "12:15 PM",
    status: "Sent"
  },
  {
    billNo: "BILL-0040",
    customerName: "Priya Nair",
    customerWhatsapp: "9845012345",
    items: [
      { itemId: 1, itemName: "Veg Spring Roll", price: 120, quantity: 2 },
      { itemId: 6, itemName: "Mango Lassi", price: 80, quantity: 1 }
    ],
    subtotal: 320,
    tax: 16,
    grandTotal: 336,
    date: "2026-05-22",
    timestamp: "11:20 AM",
    status: "Printed"
  },
  {
    billNo: "BILL-0039",
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
    items: [
      { itemId: 4, itemName: "Dal Makhani", price: 200, quantity: 1 },
      { itemId: 5, itemName: "Garlic Naan", price: 40, quantity: 2 },
      { itemId: 8, itemName: "Gulab Jamun", price: 60, quantity: 1 }
    ],
    subtotal: 340,
    tax: 17,
    grandTotal: 357,
    date: "2026-05-21",
    timestamp: "09:30 PM",
    status: "Printed"
  },
  {
    billNo: "BILL-0038",
    customerName: "Ravi Kumar",
    customerWhatsapp: "9901234567",
    items: [
      { itemId: 3, itemName: "Butter Chicken", price: 280, quantity: 2 },
      { itemId: 10, itemName: "Tandoori Roti", price: 30, quantity: 4 },
      { itemId: 6, itemName: "Mango Lassi", price: 80, quantity: 2 }
    ],
    subtotal: 840,
    tax: 42,
    grandTotal: 882,
    date: "2026-05-20",
    timestamp: "08:15 PM",
    status: "Sent"
  },
  {
    billNo: "BILL-0037",
    customerName: "Suresh Babu",
    customerWhatsapp: "9632145870",
    items: [
      { itemId: 4, itemName: "Dal Makhani", price: 200, quantity: 1 },
      { itemId: 5, itemName: "Garlic Naan", price: 40, quantity: 3 },
      { itemId: 9, itemName: "Rasgulla", price: 60, quantity: 2 }
    ],
    subtotal: 440,
    tax: 22,
    grandTotal: 462,
    date: "2026-05-20",
    timestamp: "01:10 PM",
    status: "Printed"
  },
  {
    billNo: "BILL-0036",
    customerName: "Neha Gupta",
    customerWhatsapp: "9818273645",
    items: [
      { itemId: 11, itemName: "Chow Mein", price: 140, quantity: 1 },
      { itemId: 12, itemName: "Kulfi Falooda", price: 90, quantity: 2 }
    ],
    subtotal: 320,
    tax: 16,
    grandTotal: 336,
    date: "2026-05-19",
    timestamp: "04:45 PM",
    status: "Sent"
  },
  {
    billNo: "BILL-0035",
    customerName: "Vikram Singh",
    customerWhatsapp: "9123456789",
    items: [
      { itemId: 2, itemName: "Paneer Tikka", price: 180, quantity: 2 },
      { itemId: 5, itemName: "Garlic Naan", price: 40, quantity: 4 },
      { itemId: 6, itemName: "Mango Lassi", price: 80, quantity: 3 }
    ],
    subtotal: 760,
    tax: 38,
    grandTotal: 798,
    date: "2026-05-18",
    timestamp: "08:50 PM",
    status: "Sent"
  }
];

export const INITIAL_STAFF: StaffAccount[] = [
  { id: 1, name: "Gladina Samantha", role: "Waiters" },
  { id: 2, name: "Rajesh Kumar", role: "Owner" },
  { id: 3, name: "Amit Sharma", role: "Staff" }
];
