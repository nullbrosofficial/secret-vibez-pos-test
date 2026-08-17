import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("Secret Vibez POS API Integration Tests", () => {
  let app: FastifyInstance;
  let ownerToken = "";
  let waiterToken = "";

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Authenticate all roles up front so tokens are available for every test
    const ownerRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@secretvibez.com", password: "admin0987654321" }
    });
    ownerToken = JSON.parse(ownerRes.payload).accessToken;

    const waiterRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "waiter@secretvibez.com", password: "Waiter@123" }
    });
    waiterToken = JSON.parse(waiterRes.payload).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // 0. Health Check Test
  it("should return ok status on GET /api/v1/health", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toEqual({ status: "ok" });
  });

  // 1. Auth Login Tests
  it("should fail login with invalid credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "admin@secretvibez.com",
        password: "WrongPassword@123"
      }
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe("Invalid email or password");
  });

  it("should log in successfully as OWNER and return JWT", async () => {
    expect(ownerToken).toBeTruthy();
  });

  it("should log in successfully as WAITER and return JWT", async () => {
    expect(waiterToken).toBeTruthy();
  });

  // 2. Role Protection Tests
  it("should reject loading settings without authorization token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/settings"
    });
    expect(response.statusCode).toBe(401);
  });

  it("should block a WAITER from updating settings", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/settings",
      headers: {
        authorization: `Bearer ${waiterToken}`
      },
      payload: {
        restaurantName: "Hacked Vibez",
        address: "Goa",
        phone: "00000",
        gstNumber: "00000",
        isGstEnabled: false,
        gstRate: 0
      }
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe("Unauthorized");
  });

  it("should allow OWNER to read settings", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/settings",
      headers: {
        authorization: `Bearer ${ownerToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.restaurantName).toBe("Secret Vibez");
  });

  // 3. Billing & Calculations Test
  it("should create an order with correct subtotal, tax, and total", async () => {
    // 1. Get a menu item from DB first
    const menuResponse = await app.inject({
      method: "GET",
      url: "/api/v1/menu"
    });
    const menuItems = JSON.parse(menuResponse.payload);
    const testItem = menuItems.find((i: any) => i.name === "Dal Makhani") || menuItems[0];
    expect(testItem).toBeDefined();

    // 2. Post an order
    const orderResponse = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: {
        authorization: `Bearer ${ownerToken}`
      },
      payload: {
        discount: 0,
        status: "DRAFT",
        items: [
          {
            menuItemId: testItem.id,
            quantity: 2,
            notes: "Extra buttery"
          }
        ]
      }
    });

    expect(orderResponse.statusCode).toBe(200);
    const order = JSON.parse(orderResponse.payload);
    expect(order.subtotal).toBe(testItem.price * 2);
    // CGST+SGST (5%) is enabled by default in settings
    const expectedTax = (testItem.price * 2) * 0.05;
    expect(order.tax).toBe(expectedTax);
    expect(order.grandTotal).toBe((testItem.price * 2) + expectedTax);
  });

  // 4. User Accounts Management & RBAC Tests
  describe("User Accounts & RBAC Enforcement", () => {
    let cashierToken = "";
    let chefToken = "";
    let newlyCreatedUserId = 0;

    beforeAll(async () => {
      // Re-login owner to ensure token is fresh (outer token may not be set yet)
      const resOwner = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "admin@secretvibez.com", password: "admin0987654321" }
      });
      ownerToken = JSON.parse(resOwner.payload).accessToken;

      // Login as Cashier
      const resCashier = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "cashier@secretvibez.com", password: "Cashier@123" }
      });
      cashierToken = JSON.parse(resCashier.payload).accessToken;

      // Login as Chef
      const resChef = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "chef@secretvibez.com", password: "Chef@123" }
      });
      chefToken = JSON.parse(resChef.payload).accessToken;
    });

    it("should allow Cashier login successfully", async () => {
      expect(cashierToken).toBeTruthy();
    });

    it("should block non-OWNER roles from viewing users list", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${waiterToken}` }
      });
      expect(res.statusCode).toBe(403);
    });

    it("should block non-OWNER roles from creating users", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${waiterToken}` },
        payload: {
          name: "Hacker Employee",
          email: "hacker@secretvibez.com",
          role: "CHEF",
          password: "Password@123",
          confirmPassword: "Password@123"
        }
      });
      expect(res.statusCode).toBe(403);
    });

    it("should block non-OWNER roles from deleting users", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/users/2",
        headers: { authorization: `Bearer ${cashierToken}` }
      });
      expect(res.statusCode).toBe(403);
    });

    it("should allow OWNER to create cashier, chef, and waiter users successfully", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          name: "Test Waiter",
          email: "testwaiter@secretvibez.com",
          role: "WAITER",
          password: "TestPassword@123",
          confirmPassword: "TestPassword@123",
          active: true
        }
      });

      expect(res.statusCode).toBe(200);
      const user = JSON.parse(res.payload);
      expect(user.email).toBe("testwaiter@secretvibez.com");
      expect(user.role).toBe("waiter");
      newlyCreatedUserId = user.id;
    });

    it("should reject creating a user with duplicate email", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          name: "Test Waiter Duplicate",
          email: "testwaiter@secretvibez.com",
          role: "WAITER",
          password: "TestPassword@123",
          confirmPassword: "TestPassword@123",
          active: true
        }
      });
      expect(res.statusCode).toBe(409);
    });

    it("should allow OWNER to deactivate a user account", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${newlyCreatedUserId}/status`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { active: false }
      });
      expect(res.statusCode).toBe(200);
      const user = JSON.parse(res.payload);
      expect(user.active).toBe(false);
    });

    it("should block a deactivated user from logging in", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "testwaiter@secretvibez.com",
          password: "TestPassword@123"
        }
      });
      expect(res.statusCode).toBe(401);
    });

    it("should allow OWNER to activate user back and log in successfully", async () => {
      // 1. Activate
      const activateRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/users/${newlyCreatedUserId}/status`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { active: true }
      });
      expect(activateRes.statusCode).toBe(200);

      // 2. Try Login
      const loginRes = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "testwaiter@secretvibez.com",
          password: "TestPassword@123"
        }
      });
      expect(loginRes.statusCode).toBe(200);
    });

    it("should allow OWNER to reset a user's password", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/users/${newlyCreatedUserId}/reset-password`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          password: "NewPassword@321",
          confirmPassword: "NewPassword@321"
        }
      });
      expect(res.statusCode).toBe(200);

      // Login with old password fails
      const oldLogin = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "testwaiter@secretvibez.com", password: "TestPassword@123" }
      });
      expect(oldLogin.statusCode).toBe(401);

      // Login with new password succeeds
      const newLogin = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "testwaiter@secretvibez.com", password: "NewPassword@321" }
      });
      expect(newLogin.statusCode).toBe(200);
    });

    it("should prevent OWNER from deleting their own account", async () => {
      // Get the actual owner user ID from the users list
      const usersRes = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      const users = JSON.parse(usersRes.payload);
      const ownerUser = users.find((u: any) => u.role === "owner");
      expect(ownerUser).toBeDefined();

      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/users/${ownerUser.id}`,
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(res.statusCode).toBe(403);
    });

    it("should allow OWNER to delete a test user account", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/users/${newlyCreatedUserId}`,
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
