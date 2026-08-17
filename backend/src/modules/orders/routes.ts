import { FastifyInstance } from "fastify";
import { z } from "zod";

const createOrderSchema = z.object({
  tableId: z.number().int().optional().nullable(),
  customerId: z.number().int().optional().nullable(),
  discount: z.number().nonnegative().default(0),
  items: z.array(z.object({
    menuItemId: z.number().int(),
    quantity: z.number().int().positive(),
    notes: z.string().optional().nullable()
  })).min(1),
  status: z.enum([
    "DRAFT", "CONFIRMED", "SENT_TO_KITCHEN", "PREPARING", 
    "READY", "SERVED", "BILL_REQUESTED", "PROCESSING", "PAID", "COMPLETED", "CANCELLED"
  ]).default("DRAFT")
});

const allowedTransitions: Record<string, string[]> = {
  "DRAFT": ["CONFIRMED", "SENT_TO_KITCHEN", "CANCELLED"],
  "CONFIRMED": ["SENT_TO_KITCHEN", "PREPARING", "CANCELLED"],
  "SENT_TO_KITCHEN": ["PREPARING", "READY", "CANCELLED"],
  "PREPARING": ["READY", "CANCELLED"],
  "READY": ["SERVED", "BILL_REQUESTED", "PAID", "COMPLETED", "CANCELLED"],
  "SERVED": ["BILL_REQUESTED", "PAID", "COMPLETED", "CANCELLED"],
  "BILL_REQUESTED": ["PROCESSING", "PAID", "COMPLETED", "CANCELLED"],
  "PROCESSING": ["PAID", "COMPLETED", "CANCELLED"],
  "PAID": ["COMPLETED"],
  "COMPLETED": [],
  "CANCELLED": []
};

// Generate helper function for order numbers
function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function getIndianTimeString() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${strMinutes} ${ampm}`;
}

export default async function orderRoutes(fastify: FastifyInstance) {
  // GET /api/v1/orders
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { status, tableId } = request.query as any;

    const where: any = {};
    if (status) where.status = status;
    if (tableId) where.tableId = parseInt(tableId, 10);

    const list = await fastify.prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        user: true,
        items: {
          include: { menuItem: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return list;
  });

  // GET /api/v1/orders/:id
  fastify.get("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
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
        items: {
          include: { menuItem: true }
        },
        payment: true
      }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    return order;
  });

  // POST /api/v1/orders
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "WAITER", "CASHIER"])]
  }, async (request, reply) => {
    const parseResult = createOrderSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid order payload", details: parseResult.error.format() });
    }

    const { tableId, customerId, discount, items, status } = parseResult.data;
    const userId = request.user.sub;

    // Load active settings to apply GST
    const settings = await fastify.prisma.restaurantSettings.findUnique({
      where: { id: 1 }
    });
    if (!settings) {
      return reply.status(500).send({ error: "Restaurant settings not initialized" });
    }

    // Retrieve active menu items from DB
    const dbMenuItems = await fastify.prisma.menuItem.findMany({
      where: {
        id: { in: items.map(i => i.menuItemId) }
      }
    });

    // Make sure all ordered items exist and are available
    for (const item of items) {
      const found = dbMenuItems.find(m => m.id === item.menuItemId);
      if (!found) {
        return reply.status(400).send({ error: `Menu item ID ${item.menuItemId} not found` });
      }
      if (!found.availability) {
        return reply.status(400).send({ error: `Menu item "${found.name}" is currently unavailable` });
      }
    }

    // Server-side calculation of totals
    let subtotal = 0;
    const orderItemsData = items.map(item => {
      const menuItem = dbMenuItems.find(m => m.id === item.menuItemId)!;
      const price = menuItem.price;
      subtotal += price * item.quantity;

      return {
        menuItemId: item.menuItemId,
        itemName: menuItem.name,
        price,
        quantity: item.quantity,
        notes: item.notes
      };
    });

    const netSubtotal = subtotal - discount;
    const tax = settings.isGstEnabled ? (netSubtotal * (settings.gstRate / 100)) : 0;
    const grandTotal = Math.max(0, netSubtotal + tax);

    // Run order creation and table status change in a single transaction
    const order = await fastify.prisma.$transaction(async (tx) => {
      const orderCount = await tx.order.count();
      const orderNo = `BILL-0${41 + orderCount}`; // Matches current billing billNo mock format

      const createdOrder = await tx.order.create({
        data: {
          orderNo,
          tableId,
          customerId,
          userId,
          subtotal,
          discount,
          tax,
          grandTotal,
          status,
          date: getTodayDateString(),
          timestamp: getIndianTimeString(),
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true,
          table: true,
          customer: true
        }
      });

      // Update table status if tableId is provided
      if (tableId) {
        let tableStatus = "AVAILABLE";
        if (status === "SENT_TO_KITCHEN" || status === "PREPARING" || status === "READY" || status === "SERVED") {
          tableStatus = "OCCUPIED";
        } else if (status === "BILL_REQUESTED") {
          tableStatus = "BILL_REQUESTED";
        }

        const table = await tx.restaurantTable.update({
          where: { id: tableId },
          data: { status: tableStatus }
        });

        fastify.io?.emit("table.status_changed", table);
      }

      return createdOrder;
    });

    // Realtime broadcasts
    fastify.io?.emit("order.created", order);
    if (status === "SENT_TO_KITCHEN") {
      fastify.io?.emit("kitchen.order_received", order);
    }

    return order;
  });

  // PATCH /api/v1/orders/:id/status
  fastify.patch("/:id/status", {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid order ID" });
    }

    const schema = z.object({
      status: z.enum([
        "DRAFT", "CONFIRMED", "SENT_TO_KITCHEN", "PREPARING", 
        "READY", "SERVED", "BILL_REQUESTED", "PROCESSING", "PAID", "COMPLETED", "CANCELLED"
      ])
    });

    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid status value" });
    }

    const newStatus = parseResult.data.status;

    // Load active order to inspect current status
    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    // Role security check for transitions
    const role = request.user.role.toUpperCase();
    if (role === "CHEF" && !["PREPARING", "READY", "COMPLETED"].includes(newStatus)) {
      return reply.status(403).send({ error: "Chef role is only authorized for kitchen status updates" });
    }
    if (role === "WAITER" && ["PAID", "COMPLETED"].includes(newStatus)) {
      return reply.status(403).send({ error: "Waiter role is unauthorized to mark orders as paid or completed" });
    }

    // Validate lifecycle transitions
    const allowed = allowedTransitions[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return reply.status(400).send({
        error: "Invalid transition",
        message: `Cannot transition order status from ${order.status} to ${newStatus}`
      });
    }

    // Transaction to update order status and table status
    const updatedOrder = await fastify.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id },
        data: { status: newStatus },
        include: { table: true, items: true }
      });

      // Synchronize table status
      if (res.tableId) {
        let tableStatus = res.table.status;
        if (newStatus === "SENT_TO_KITCHEN" || newStatus === "PREPARING" || newStatus === "READY" || newStatus === "SERVED") {
          tableStatus = "OCCUPIED";
        } else if (newStatus === "BILL_REQUESTED" || newStatus === "PROCESSING") {
          tableStatus = "BILL_REQUESTED";
        } else if (newStatus === "PAID" || newStatus === "COMPLETED") {
          tableStatus = "CLEANING";
        } else if (newStatus === "CANCELLED") {
          tableStatus = "AVAILABLE";
        }

        const table = await tx.restaurantTable.update({
          where: { id: res.tableId },
          data: { status: tableStatus }
        });

        fastify.io?.emit("table.status_changed", table);
      }

      return res;
    });

    // Realtime events
    fastify.io?.emit("order.status_changed", updatedOrder);
    if (newStatus === "READY") {
      fastify.io?.emit("kitchen.order_ready", updatedOrder);
    }

    return updatedOrder;
  });

  // POST /api/v1/orders/:id/request-bill
  fastify.post("/:id/request-bill", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER", "WAITER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid order ID" });
    }

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    if (!["READY", "SERVED"].includes(order.status)) {
      return reply.status(400).send({ error: "Order must be READY or SERVED to request bill" });
    }

    const updated = await fastify.prisma.$transaction(async (tx) => {
      const res = await tx.order.update({
        where: { id },
        data: { status: "BILL_REQUESTED" },
        include: { table: true, items: true }
      });

      if (res.tableId) {
        await tx.restaurantTable.update({
          where: { id: res.tableId },
          data: { status: "BILL_REQUESTED" }
        });
      }

      return res;
    });

    fastify.io?.emit("order.status_changed", updated);
    if (updated.table) {
      fastify.io?.emit("table.status_changed", updated.table);
    }
    fastify.io?.emit("bill.requested", updated);

    return updated;
  });
}
