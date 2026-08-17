import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["OWNER", "CASHIER", "WAITER", "CHEF", "owner", "cashier", "waiter", "chef"]),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  active: z.boolean().default(true)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["OWNER", "CASHIER", "WAITER", "CHEF", "owner", "cashier", "waiter", "chef"]).optional(),
  active: z.boolean().optional()
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default async function userRoutes(fastify: FastifyInstance) {
  // OWNER ONLY Check middleware wrapper
  const ownerPreHandler = [
    fastify.authenticate,
    fastify.checkRole(["OWNER"])
  ];

  // GET /api/v1/users
  fastify.get("/", { preHandler: ownerPreHandler }, async (request, reply) => {
    const list = await fastify.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "asc" }
    });

    // Strip passwords before returning
    return list.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name.toLowerCase(),
      displayRoleName: u.role.name,
      active: u.active,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  });

  // GET /api/v1/users/:id
  fastify.get("/:id", { preHandler: ownerPreHandler }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }

    const u = await fastify.prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!u) {
      return reply.status(404).send({ error: "User not found" });
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name.toLowerCase(),
      displayRoleName: u.role.name,
      active: u.active,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  });

  // POST /api/v1/users
  fastify.post("/", { preHandler: ownerPreHandler }, async (request, reply) => {
    const parseResult = createUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid user data", details: parseResult.error.format() });
    }

    const { name, email, role, password, active } = parseResult.data;

    // Prevent normal UI owners from creating another OWNER role unless configured
    const normalizedRole = role.toUpperCase();
    if (normalizedRole === "OWNER") {
      return reply.status(403).send({ error: "Cannot create owner accounts from normal UI" });
    }

    // Check if email already exists
    const existing = await fastify.prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      return reply.status(409).send({ error: "Email address must be unique" });
    }

    // Map role string to roleId in database
    const dbRole = await fastify.prisma.role.findUnique({
      where: { name: normalizedRole }
    });
    if (!dbRole) {
      return reply.status(400).send({ error: `Role ${role} does not exist in DB` });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await fastify.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        roleId: dbRole.id,
        active
      },
      include: { role: true }
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role.name.toLowerCase(),
      displayRoleName: created.role.name,
      active: created.active,
      createdAt: created.createdAt
    };
  });

  // PATCH /api/v1/users/:id
  fastify.patch("/:id", { preHandler: ownerPreHandler }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }

    const parseResult = updateUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid update payload", details: parseResult.error.format() });
    }

    const { name, email, role, active } = parseResult.data;

    // Check target user exists
    const target = await fastify.prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
    if (!target) {
      return reply.status(404).send({ error: "User not found" });
    }

    const data: any = {};
    if (name) data.name = name;
    
    if (email && email !== target.email) {
      const existing = await fastify.prisma.user.findUnique({
        where: { email }
      });
      if (existing) {
        return reply.status(409).send({ error: "Email address is already in use by another account" });
      }
      data.email = email;
    }

    if (role) {
      const normalizedRole = role.toUpperCase();
      if (normalizedRole === "OWNER" && target.role.name !== "OWNER") {
        return reply.status(403).send({ error: "Cannot elevate account role to Admin Owner" });
      }
      const dbRole = await fastify.prisma.role.findUnique({
        where: { name: normalizedRole }
      });
      if (!dbRole) {
        return reply.status(400).send({ error: `Role ${role} does not exist` });
      }
      data.roleId = dbRole.id;
    }

    if (active !== undefined) {
      // Prevent current owner from deactivating themselves
      if (id === request.user.sub && !active) {
        return reply.status(403).send({ error: "Cannot deactivate your own active session account" });
      }
      data.active = active;
    }

    const updated = await fastify.prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role.name.toLowerCase(),
      displayRoleName: updated.role.name,
      active: updated.active,
      createdAt: updated.createdAt
    };
  });

  // PATCH /api/v1/users/:id/status
  fastify.patch("/:id/status", { preHandler: ownerPreHandler }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }

    const schema = z.object({ active: z.boolean() });
    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid status value" });
    }

    const { active } = parseResult.data;

    // Prevent self-deactivation
    if (id === request.user.sub && !active) {
      return reply.status(403).send({ error: "Cannot deactivate your own administrator account" });
    }

    try {
      const updated = await fastify.prisma.user.update({
        where: { id },
        data: { active },
        include: { role: true }
      });

      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.name.toLowerCase(),
        displayRoleName: updated.role.name,
        active: updated.active
      };
    } catch (err) {
      return reply.status(404).send({ error: "User not found" });
    }
  });

  // POST /api/v1/users/:id/reset-password
  fastify.post("/:id/reset-password", { preHandler: ownerPreHandler }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }

    const parseResult = resetPasswordSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid password format", details: parseResult.error.format() });
    }

    const { password } = parseResult.data;

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await fastify.prisma.user.update({
        where: { id },
        data: { password: passwordHash }
      });

      return { success: true, message: "User password reset successfully" };
    } catch (err) {
      return reply.status(404).send({ error: "User not found" });
    }
  });

  // DELETE /api/v1/users/:id
  fastify.delete("/:id", { preHandler: ownerPreHandler }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }

    // Do not allow current owner to delete themselves
    if (id === request.user.sub) {
      return reply.status(403).send({ error: "Cannot delete your own admin account" });
    }

    // Load user to check role and order history
    const target = await fastify.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        orders: true,
        payments: true
      }
    });

    if (!target) {
      return reply.status(404).send({ error: "User not found" });
    }

    // Prevent deleting the last OWNER account
    if (target.role.name === "OWNER") {
      const ownersCount = await fastify.prisma.user.count({
        where: { role: { name: "OWNER" } }
      });
      if (ownersCount <= 1) {
        return reply.status(403).send({ error: "Cannot delete the last administrator account" });
      }
    }

    // Soft deactivation fallback if they have historical records
    if (target.orders.length > 0 || target.payments.length > 0) {
      await fastify.prisma.user.update({
        where: { id },
        data: { active: false }
      });
      return { success: true, message: "User has historical sales data. Account has been deactivated instead of deleted." };
    }

    // Normal hard delete
    await fastify.prisma.user.delete({
      where: { id }
    });

    return { success: true, message: "User account deleted permanently" };
  });
}
