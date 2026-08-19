import { FastifyInstance } from "fastify";
import { z } from "zod";

const createPaymentSchema = z.object({
  orderId: z.number().int(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["Cash", "UPI / QR", "Card"])
});

export default async function paymentRoutes(fastify: FastifyInstance) {
  // POST /api/v1/payments
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "CASHIER"])]
  }, async (request, reply) => {
    const parseResult = createPaymentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payment payload", details: parseResult.error.format() });
    }

    const { orderId, amount, paymentMethod } = parseResult.data;
    const userId = request.user.sub;

    // Retrieve the order details
    const order = await fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    if (order.status === "COMPLETED" || order.status === "PAID") {
      return reply.status(409).send({ error: "Order is already paid/completed" });
    }

    // Execute Payment, Order completion, Table release, and Customer update in a transaction
    const result = await fastify.prisma.$transaction(async (tx) => {
      // 1. Record payment details
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount,
          paymentMethod,
          status: "COMPLETED",
          userId
        }
      });

      // 2. Mark order as COMPLETED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED" },
        include: { items: true }
      });

      // 3. Release restaurant table status to AVAILABLE
      if (order.tableId) {
        const releasedTable = await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" }
        });
        fastify.io.emit("table.status_changed", releasedTable);
      }



      return { payment, order: updatedOrder };
    });

    // Notify listeners
    fastify.io?.emit("payment.completed", result.payment);
    fastify.io?.emit("order.status_changed", result.order);

    return result;
  });
}
