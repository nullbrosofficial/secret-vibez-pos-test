import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";

const settingsUpdateSchema = z.object({
  restaurantName: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  gstNumber: z.string().min(1),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  isGstEnabled: z.boolean(),
  gstRate: z.number().nonnegative(),
  currency: z.string().default("INR")
});

const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["owner", "cashier", "waiter", "chef"]) // Lowercase from frontend, mapped to uppercase DB roles
});

export default async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/settings
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    let settings = await fastify.prisma.restaurantSettings.findUnique({
      where: { id: 1 }
    });

    if (!settings) {
      // Fallback init
      settings = await fastify.prisma.restaurantSettings.create({
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
    }

    return settings;
  });

  // PUT /api/v1/settings
  fastify.put("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const parseResult = settingsUpdateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid settings payload", details: parseResult.error.format() });
    }

    try {
      const updated = await fastify.prisma.restaurantSettings.update({
        where: { id: 1 },
        data: parseResult.data
      });

      // Notify clients
      fastify.io?.emit("settings.updated", updated);

      return updated;
    } catch (err) {
      return reply.status(500).send({ error: "Failed to update settings" });
    }
  });

  // GET /api/v1/settings/staff (List staff)
  fastify.get("/staff", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const staffList = await fastify.prisma.user.findMany({
      include: { role: true },
      orderBy: { name: "asc" }
    });

    // Map database roles cleanly to expected frontend structure
    return staffList.map(st => ({
      id: st.id,
      name: st.name,
      email: st.email,
      role: st.role.name.toLowerCase(), // e.g. owner, cashier, waiter, chef
      displayRoleName: st.role.name,
      active: st.active
    }));
  });

  // POST /api/v1/settings/staff (Add staff)
  fastify.post("/staff", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const parseResult = createStaffSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid staff payload", details: parseResult.error.format() });
    }

    const { name, email, password, role } = parseResult.data;

    // Check if email already registered
    const existing = await fastify.prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      return reply.status(409).send({ error: "Email is already registered" });
    }

    // Find database role ID
    const dbRole = await fastify.prisma.role.findUnique({
      where: { name: role.toUpperCase() }
    });
    if (!dbRole) {
      return reply.status(400).send({ error: `Role ${role} does not exist in DB` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await fastify.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: dbRole.id,
        active: true
      },
      include: { role: true }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name.toLowerCase(),
      displayRoleName: user.role.name,
      active: user.active
    };
  });

  // DELETE /api/v1/settings/staff/:id (Delete staff)
  fastify.delete("/staff/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid staff ID" });
    }

    // Prevent OWNER from deleting themselves
    const currentUserId = request.user.sub;
    if (id === currentUserId) {
      return reply.status(400).send({ error: "You cannot delete your own account" });
    }

    try {
      await fastify.prisma.user.delete({
        where: { id }
      });
      return { success: true };
    } catch (err) {
      return reply.status(404).send({ error: "Staff member not found" });
    }
  });
}
