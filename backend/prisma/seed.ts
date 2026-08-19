import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Check if data already exists to avoid resetting it
  const rolesCount = await prisma.role.count();
  if (rolesCount > 0) {
    console.log("Database already has roles. Skipping seed to prevent overwriting existing data.");
    return;
  }

  // 2. Seed Roles
  const ownerRole = await prisma.role.create({
    data: { name: "OWNER", description: "Full access to dashboard, reports, settings, menu, POS" }
  });
  const cashierRole = await prisma.role.create({
    data: { name: "CASHIER", description: "Biller / Cashier access to Billing POS view only" }
  });
  const waiterRole = await prisma.role.create({
    data: { name: "WAITER", description: "Waiter access to Table layout and Order taking only" }
  });
  const chefRole = await prisma.role.create({
    data: { name: "CHEF", description: "Chef access to Kitchen Display System only" }
  });

  // 3. Seed Users with hashed passwords
  const saltRounds = 10;
  const ownerPassword = await bcrypt.hash("admin0987654321", saltRounds);
  const cashierPassword = await bcrypt.hash("Cashier@123", saltRounds);
  const waiterPassword = await bcrypt.hash("Waiter@123", saltRounds);
  const chefPassword = await bcrypt.hash("Chef@123", saltRounds);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@secretvibez.com",
        password: ownerPassword,
        name: "Rajesh Kumar",
        roleId: ownerRole.id,
        active: true
      },
      {
        email: "cashier@secretvibez.com",
        password: cashierPassword,
        name: "Amit Sharma",
        roleId: cashierRole.id,
        active: true
      },
      {
        email: "waiter@secretvibez.com",
        password: waiterPassword,
        name: "Gladina Samantha",
        roleId: waiterRole.id,
        active: true
      },
      {
        email: "chef@secretvibez.com",
        password: chefPassword,
        name: "Ramesh Chef",
        roleId: chefRole.id,
        active: true
      }
    ]
  });

  // 4. Seed Categories and Items
  const starters = await prisma.menuCategory.create({ data: { name: "Starters" } });
  const mainCourse = await prisma.menuCategory.create({ data: { name: "Main Course" } });
  const beverages = await prisma.menuCategory.create({ data: { name: "Beverages" } });
  const desserts = await prisma.menuCategory.create({ data: { name: "Desserts" } });

  await prisma.menuItem.createMany({
    data: [
      { name: "Veg Spring Roll", price: 120, categoryId: starters.id, vegNonVeg: "Veg", availability: true },
      { name: "Paneer Tikka", price: 180, categoryId: starters.id, vegNonVeg: "Veg", availability: true },
      { name: "Chow Mein", price: 140, categoryId: starters.id, vegNonVeg: "Veg", availability: true },
      { name: "Butter Chicken", price: 280, categoryId: mainCourse.id, vegNonVeg: "Non-Veg", availability: true },
      { name: "Dal Makhani", price: 200, categoryId: mainCourse.id, vegNonVeg: "Veg", availability: true },
      { name: "Garlic Naan", price: 40, categoryId: mainCourse.id, vegNonVeg: "Veg", availability: true },
      { name: "Tandoori Roti", price: 30, categoryId: mainCourse.id, vegNonVeg: "Veg", availability: true },
      { name: "Mango Lassi", price: 80, categoryId: beverages.id, vegNonVeg: "Veg", availability: true },
      { name: "Masala Chai", price: 30, categoryId: beverages.id, vegNonVeg: "Veg", availability: true },
      { name: "Gulab Jamun", price: 60, categoryId: desserts.id, vegNonVeg: "Veg", availability: true },
      { name: "Rasgulla", price: 60, categoryId: desserts.id, vegNonVeg: "Veg", availability: true },
      { name: "Kulfi Falooda", price: 90, categoryId: desserts.id, vegNonVeg: "Veg", availability: true }
    ]
  });

  // 5. Seed Restaurant Tables
  await prisma.restaurantTable.createMany({
    data: [
      { tableNumber: "1", capacity: 2, status: "AVAILABLE" },
      { tableNumber: "2", capacity: 4, status: "AVAILABLE" },
      { tableNumber: "3", capacity: 4, status: "AVAILABLE" },
      { tableNumber: "4", capacity: 6, status: "AVAILABLE" },
      { tableNumber: "5", capacity: 2, status: "AVAILABLE" },
      { tableNumber: "6", capacity: 8, status: "AVAILABLE" }
    ]
  });

  // 6. Seed Customers
  await prisma.customer.createMany({
    data: [
      { name: "Arjun Sharma", whatsapp: "9876543210", visits: 14, spent: 4820.0, birthday: "1990-03-15" },
      { name: "Priya Nair", whatsapp: "9845012345", visits: 7, spent: 2100.0, birthday: "1995-07-22" },
      { name: "Ravi Kumar", whatsapp: "9901234567", visits: 22, spent: 7300.0, birthday: "1988-11-05" },
      { name: "Meena Patel", whatsapp: "9712345678", visits: 3, spent: 850.0, birthday: "2000-01-30" },
      { name: "Suresh Babu", whatsapp: "9632145870", visits: 11, spent: 3600.0, birthday: "1982-09-18" },
      { name: "Rohan Verma", whatsapp: "9820123456", visits: 8, spent: 2450.0, birthday: "1993-04-12" },
      { name: "Aditi Rao", whatsapp: "9510293847", visits: 5, spent: 1540.0, birthday: "1997-12-05" },
      { name: "Vikram Singh", whatsapp: "9123456789", visits: 18, spent: 5900.0, birthday: "1985-05-25" },
      { name: "Neha Gupta", whatsapp: "9818273645", visits: 12, spent: 4100.0, birthday: "1991-08-09" }
    ]
  });

  // 7. Seed Settings
  await prisma.restaurantSettings.create({
    data: {
      id: 1,
      restaurantName: "Secret Vibez",
      address: "Beach Road, Calangute, Goa 403516",
      phone: "+91 98765 43210",
      gstNumber: "30AABCS1429B1Z8",
      receiptHeader: "Welcome to Secret Vibez • Food & Stay",
      receiptFooter: "Thank you for dining with us! Follow us @secretvibez",
      isGstEnabled: true,
      gstRate: 5.0,
      currency: "INR"
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
