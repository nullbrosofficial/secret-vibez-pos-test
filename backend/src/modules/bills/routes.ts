import { FastifyInstance } from "fastify";
import { z } from "zod";

const paymentPayloadSchema = z.object({
  paymentMethod: z.enum(["Cash", "UPI / QR", "Card"]),
  discount: z.number().nonnegative().default(0)
});

export default async function billRoutes(fastify: FastifyInstance) {
  // GET /api/v1/bills/queue
  fastify.get("/queue", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const list = await fastify.prisma.order.findMany({
      where: {
        status: { in: ["BILL_REQUESTED", "PROCESSING", "PAID", "COMPLETED"] }
      },
      include: {
        table: true,
        customer: true,
        user: true,
        payment: true,
        items: {
          include: { menuItem: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return list;
  });

  // GET /api/v1/bills/:id
  fastify.get("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid order ID" });
    }

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        user: true,
        payment: true,
        items: {
          include: { menuItem: true }
        }
      }
    });

    if (!order) {
      return reply.status(404).send({ error: "Bill not found" });
    }

    return order;
  });

  // POST /api/v1/bills/:id/payment
  fastify.post("/:id/payment", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid order ID" });
    }

    const parseResult = paymentPayloadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payment payload", details: parseResult.error.format() });
    }

    const { paymentMethod, discount } = parseResult.data;
    const userId = request.user.sub;

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: { table: true, payment: true }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    if (order.status === "PAID" || order.status === "COMPLETED" || order.payment) {
      return reply.status(409).send({ error: "Order is already paid/settled" });
    }

    // Load active settings to recalculate GST on the server
    const settings = await fastify.prisma.restaurantSettings.findUnique({
      where: { id: 1 }
    });
    if (!settings) {
      return reply.status(500).send({ error: "Restaurant settings not initialized" });
    }

    // Server-side safe calculations
    const subtotal = order.subtotal;
    const netSubtotal = Math.max(0, subtotal - discount);
    const tax = settings.isGstEnabled ? (netSubtotal * (settings.gstRate / 100)) : 0;
    const grandTotal = Math.max(0, netSubtotal + tax);

    // Database updates in a safe transaction block to prevent concurrent duplicates
    const result = await fastify.prisma.$transaction(async (tx) => {
      // Double check payment status inside transaction
      const doubleCheckOrder = await tx.order.findUnique({
        where: { id },
        include: { payment: true }
      });
      if (doubleCheckOrder?.payment || doubleCheckOrder?.status === "PAID") {
        throw new Error("Order was already paid in a parallel session.");
      }

      // 1. Create the payment record
      const createdPayment = await tx.payment.create({
        data: {
          orderId: id,
          amount: grandTotal,
          paymentMethod,
          status: "COMPLETED",
          userId
        }
      });

      // 2. Transition order status to PAID
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: "PAID",
          discount,
          tax,
          grandTotal,
          updatedAt: new Date()
        },
        include: { items: true, table: true }
      });

      // 3. Mark the table status as CLEANING
      if (order.tableId) {
        const cleaningTable = await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: "CLEANING" }
        });
        fastify.io?.emit("table.status_changed", cleaningTable);
      }

      // 4. Update customer loyalty spent statistics
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            visits: { increment: 1 },
            spent: { increment: grandTotal }
          }
        });
      }

      return { payment: createdPayment, order: updatedOrder };
    });

    fastify.io?.emit("payment.completed", result.payment);
    fastify.io?.emit("order.status_changed", result.order);

    return result;
  });

  // POST /api/v1/bills/:id/complete
  fastify.post("/:id/complete", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid order ID" });
    }

    const order = await fastify.prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id },
        data: { status: "COMPLETED" },
        include: { table: true }
      });

      if (res.tableId) {
        const cleaningTable = await tx.restaurantTable.update({
          where: { id: res.tableId },
          data: { status: "CLEANING" }
        });
        fastify.io?.emit("table.status_changed", cleaningTable);
      }

      return res;
    });

    fastify.io?.emit("order.status_changed", updated);

    return updated;
  });
}
