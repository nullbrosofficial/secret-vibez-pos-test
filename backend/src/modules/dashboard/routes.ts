import { FastifyInstance } from "fastify";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/v1/dashboard
  fastify.get("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const todayStr = getTodayDateString();

    // 1. Today's Revenue
    const completedOrdersToday = await fastify.prisma.order.findMany({
      where: {
        date: todayStr,
        status: "COMPLETED"
      }
    });

    const todayRevenue = completedOrdersToday.reduce((sum, o) => sum + o.grandTotal, 0);
    const todayOrdersCount = completedOrdersToday.length;

    // 2. Average Order Value
    const averageOrderValue = todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0;

    // 3. Active Tables
    const activeTablesCount = await fastify.prisma.restaurantTable.count({
      where: {
        status: { in: ["OCCUPIED", "BILL_REQUESTED", "CLEANING"] }
      }
    });

    // 4. Pending Bills
    const pendingBillsCount = await fastify.prisma.order.count({
      where: {
        status: { in: ["CONFIRMED", "SENT_TO_KITCHEN", "PREPARING", "READY", "SERVED", "BILL_REQUESTED"] }
      }
    });

    // 5. Payment Breakdown
    const paymentsToday = await fastify.prisma.payment.findMany({
      where: {
        order: {
          date: todayStr
        }
      }
    });

    const paymentBreakdown = {
      Cash: 0,
      UPI: 0,
      Card: 0
    };

    paymentsToday.forEach(p => {
      const method = p.paymentMethod;
      if (method === "Cash") {
        paymentBreakdown.Cash += p.amount;
      } else if (method === "UPI / QR") {
        paymentBreakdown.UPI += p.amount;
      } else if (method === "Card") {
        paymentBreakdown.Card += p.amount;
      }
    });

    // 6. Recent Orders
    const recentOrders = await fastify.prisma.order.findMany({
      take: 5,
      include: {
        table: true
      },
      orderBy: { createdAt: "desc" }
    });

    // 7. Top Items Sold Today
    const orderItemsToday = await fastify.prisma.orderItem.findMany({
      where: {
        order: {
          date: todayStr,
          status: "COMPLETED"
        }
      }
    });

    const itemCounts: Record<string, { name: string; quantity: number; amount: number }> = {};
    orderItemsToday.forEach(oi => {
      if (!itemCounts[oi.menuItemId]) {
        itemCounts[oi.menuItemId] = { name: oi.itemName, quantity: 0, amount: 0 };
      }
      itemCounts[oi.menuItemId].quantity += oi.quantity;
      itemCounts[oi.menuItemId].amount += oi.price * oi.quantity;
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      todayRevenue,
      todayOrdersCount,
      averageOrderValue,
      activeTablesCount,
      pendingBillsCount,
      paymentBreakdown,
      recentOrders,
      topItems
    };
  });
}
