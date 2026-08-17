import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/login
  fastify.post("/login", async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid request payload", details: parseResult.error.format() });
    }

    const { email, password } = parseResult.data;

    // Find user by email
    const user = await fastify.prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || !user.active) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    // Map role names cleanly to frontend expected format ("owner", "cashier", "waiter", "chef")
    const roleNameLower = user.role.name.toLowerCase();

    // Map role default page and allowed pages
    let defaultPage = "billing";
    let allowedPages: string[] = [];

    switch (roleNameLower) {
      case "owner":
        defaultPage = "billing";
        allowedPages = ["billing", "orders", "kitchen", "menu", "customers", "sales", "settings"];
        break;
      case "cashier":
        defaultPage = "billing";
        allowedPages = ["billing"];
        break;
      case "waiter":
        defaultPage = "orders";
        allowedPages = ["orders"];
        break;
      case "chef":
        defaultPage = "kitchen";
        allowedPages = ["kitchen"];
        break;
    }

    // Generate JWT token containing claims sub, role
    const token = fastify.jwt.sign({
      sub: user.id,
      role: roleNameLower,
      email: user.email,
      name: user.name
    }, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h"
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleNameLower,
        displayRoleName: user.role.name,
        allowedPages,
        defaultPage
      }
    };
  });

  // GET /api/v1/auth/me
  fastify.get("/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    const dbUser = await fastify.prisma.user.findUnique({
      where: { id: user.sub },
      include: { role: true }
    });

    if (!dbUser || !dbUser.active) {
      return reply.status(404).send({ error: "User not found or inactive" });
    }

    const roleNameLower = dbUser.role.name.toLowerCase();

    let defaultPage = "billing";
    let allowedPages: string[] = [];

    switch (roleNameLower) {
      case "owner":
        defaultPage = "billing";
        allowedPages = ["billing", "orders", "kitchen", "menu", "customers", "sales", "settings"];
        break;
      case "cashier":
        defaultPage = "billing";
        allowedPages = ["billing"];
        break;
      case "waiter":
        defaultPage = "orders";
        allowedPages = ["orders"];
        break;
      case "chef":
        defaultPage = "kitchen";
        allowedPages = ["kitchen"];
        break;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: roleNameLower,
      displayRoleName: dbUser.role.name,
      allowedPages,
      defaultPage
    };
  });
}
