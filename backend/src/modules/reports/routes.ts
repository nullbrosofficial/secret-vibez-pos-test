import { FastifyInstance } from "fastify";
import { z } from "zod";

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function getPastDateString(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

export default async function reportsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/reports/sales
  fastify.get("/sales", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const { range, startDate, endDate } = request.query as any;

    let start = getTodayDateString();
    let end = getTodayDateString();

    if (range === "week") {
      start = getPastDateString(7);
      end = getTodayDateString();
    } else if (range === "month") {
      start = getPastDateString(30);
      end = getTodayDateString();
    } else if (range === "custom" && startDate && endDate) {
      start = startDate;
      end = endDate;
    }

    // Query all orders in this date range
    const orders = await fastify.prisma.order.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        table: true,
        items: true,
        payment: true
      },
      orderBy: { createdAt: "desc" }
    });

    // 1. Calculate aggregates
    const completedOrders = orders.filter(o => o.status === "COMPLETED");
    const cancelledOrdersCount = orders.filter(o => o.status === "CANCELLED").length;

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalSubtotal = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalTax = completedOrders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = completedOrders.reduce((sum, o) => sum + o.discount, 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Payment breakdown
    const paymentBreakdown = { Cash: 0, UPI: 0, Card: 0 };
    completedOrders.forEach(o => {
      if (o.payment) {
        const method = o.payment.paymentMethod;
        if (method === "Cash") paymentBreakdown.Cash += o.payment.amount;
        else if (method === "UPI / QR") paymentBreakdown.UPI += o.payment.amount;
        else if (method === "Card") paymentBreakdown.Card += o.payment.amount;
      }
    });

    // 3. Top selling items
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    completedOrders.forEach(o => {
      o.items.forEach(oi => {
        if (!itemMap[oi.menuItemId]) {
          itemMap[oi.menuItemId] = { name: oi.itemName, quantity: 0, revenue: 0 };
        }
        itemMap[oi.menuItemId].quantity += oi.quantity;
        itemMap[oi.menuItemId].revenue += oi.price * oi.quantity;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // 4. Generate Chart Data
    // Group completed orders by date
    const dateGroups: Record<string, { sales: number; orders: number }> = {};
    completedOrders.forEach(o => {
      const d = o.date;
      if (!dateGroups[d]) {
        dateGroups[d] = { sales: 0, orders: 0 };
      }
      dateGroups[d].sales += o.grandTotal;
      dateGroups[d].orders += 1;
    });

    // Sort by date key
    const chartData = Object.keys(dateGroups)
      .sort()
      .map(d => ({
        name: d,
        sales: dateGroups[d].sales,
        orders: dateGroups[d].orders
      }));

    return {
      summary: {
        totalRevenue,
        totalSubtotal,
        totalTax,
        totalDiscount,
        totalOrders,
        averageOrderValue,
        cancelledOrdersCount
      },
      paymentBreakdown,
      topItems,
      chartData,
      orders
    };
  });
}
