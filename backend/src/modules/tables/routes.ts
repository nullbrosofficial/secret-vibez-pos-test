import { FastifyInstance } from "fastify";
import { z } from "zod";

const tableSchema = z.object({
  tableNumber: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "BILL_REQUESTED", "CLEANING"]).default("AVAILABLE")
});

export default async function tableRoutes(fastify: FastifyInstance) {
  // GET /api/v1/tables
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const list = await fastify.prisma.restaurantTable.findMany({
      orderBy: { tableNumber: "asc" }
    });
    return list;
  });

  // POST /api/v1/tables
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const parseResult = tableSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
    }

    const { tableNumber, capacity, status } = parseResult.data;

    // Check if tableNumber is unique
    const existing = await fastify.prisma.restaurantTable.findUnique({
      where: { tableNumber }
    });
    if (existing) {
      return reply.status(409).send({ error: "Table number already exists" });
    }

    const table = await fastify.prisma.restaurantTable.create({
      data: { tableNumber, capacity, status }
    });

    fastify.io?.emit("table.status_changed", table);

    return table;
  });

  // PUT /api/v1/tables/:id
  fastify.put("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "WAITER", "CASHIER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid table ID" });
    }

    const parseResult = tableSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;

    try {
      const updated = await fastify.prisma.restaurantTable.update({
        where: { id },
        data
      });

      fastify.io?.emit("table.status_changed", updated);

      return updated;
    } catch (err) {
      return reply.status(404).send({ error: "Table not found" });
    }
  });

  // PATCH /api/v1/tables/:id/status
  fastify.patch("/:id/status", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "WAITER", "CASHIER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid table ID" });
    }

    const schema = z.object({
      status: z.enum(["AVAILABLE", "OCCUPIED", "BILL_REQUESTED", "CLEANING"])
    });

    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid status value" });
    }

    const { status } = parseResult.data;

    try {
      const updated = await fastify.prisma.restaurantTable.update({
        where: { id },
        data: { status }
      });

      fastify.io?.emit("table.status_changed", updated);
      return updated;
    } catch (err) {
      return reply.status(404).send({ error: "Table not found" });
    }
  });
}
