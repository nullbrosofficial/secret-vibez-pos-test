import { MenuItem, Bill, StaffAccount } from "./types";

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

export const INITIAL_BILLS: Bill[] = [
  {
    billNo: "BILL-0041",
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
    customerName: "Walk-in Customer",
    customerWhatsapp: undefined,
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
