import { FastifyInstance } from "fastify";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1),
  whatsapp: z.string().min(10), // minimum 10 digit number
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional().nullable()
});

export default async function customerRoutes(fastify: FastifyInstance) {
  // GET /api/v1/customers
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { q } = request.query as any;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { whatsapp: { contains: q } }
      ];
    }

    const list = await fastify.prisma.customer.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return list;
  });

  // POST /api/v1/customers
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const parseResult = createCustomerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
    }

    const { name, whatsapp, birthday } = parseResult.data;

    // Check if phone number is already registered
    const existing = await fastify.prisma.customer.findUnique({
      where: { whatsapp }
    });
    if (existing) {
      return reply.status(409).send({ error: "WhatsApp number is already registered" });
    }

    const customer = await fastify.prisma.customer.create({
      data: {
        name,
        whatsapp,
        birthday: birthday || null,
        visits: 0,
        spent: 0
      }
    });

    return customer;
  });

  // GET /api/v1/customers/:id
  fastify.get("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid customer ID" });
    }

    const customer = await fastify.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
            payment: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!customer) {
      return reply.status(404).send({ error: "Customer not found" });
    }

    return customer;
  });
}
