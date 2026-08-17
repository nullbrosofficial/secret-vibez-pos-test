import { FastifyInstance } from "fastify";
import { z } from "zod";

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  category: z.string().min(1), // Category name string
  vegNonVeg: z.enum(["Veg", "Non-Veg"]).default("Veg"),
  availability: z.boolean().default(true)
});

export default async function menuRoutes(fastify: FastifyInstance) {
  // GET /api/v1/menu
  fastify.get("/", async (request, reply) => {
    const list = await fastify.prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { name: "asc" }
    });

    // Map back to frontend shape: flatten category relation into a string field
    return list.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category.name,
      vegNonVeg: item.vegNonVeg,
      availability: item.availability
    }));
  });

  // POST /api/v1/menu
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const parseResult = menuItemSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
    }

    const { name, description, price, category, vegNonVeg, availability } = parseResult.data;

    // Find or create category by name
    let dbCategory = await fastify.prisma.menuCategory.findUnique({
      where: { name: category }
    });

    if (!dbCategory) {
      dbCategory = await fastify.prisma.menuCategory.create({
        data: { name: category }
      });
    }

    const item = await fastify.prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        categoryId: dbCategory.id,
        vegNonVeg,
        availability
      },
      include: { category: true }
    });

    // Notify all listeners
    fastify.io?.emit("menu.updated");

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category.name,
      vegNonVeg: item.vegNonVeg,
      availability: item.availability
    };
  });

  // PUT /api/v1/menu/:id
  fastify.put("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid menu item ID" });
    }

    const parseResult = menuItemSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parseResult.error.format() });
    }

    const data = parseResult.data;
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.vegNonVeg !== undefined) updateData.vegNonVeg = data.vegNonVeg;
    if (data.availability !== undefined) updateData.availability = data.availability;

    if (data.category !== undefined) {
      // Find or create category
      let dbCategory = await fastify.prisma.menuCategory.findUnique({
        where: { name: data.category }
      });
      if (!dbCategory) {
        dbCategory = await fastify.prisma.menuCategory.create({
          data: { name: data.category }
        });
      }
      updateData.categoryId = dbCategory.id;
    }

    try {
      const updated = await fastify.prisma.menuItem.update({
        where: { id },
        data: updateData,
        include: { category: true }
      });

      // Emit realtime change event
      fastify.io?.emit("menu.updated");

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        category: updated.category.name,
        vegNonVeg: updated.vegNonVeg,
        availability: updated.availability
      };
    } catch (err) {
      return reply.status(404).send({ error: "Menu item not found" });
    }
  });

  // PATCH /api/v1/menu/:id/availability
  fastify.patch("/:id/availability", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid menu item ID" });
    }

    const schema = z.object({ availability: z.boolean() });
    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid availability value" });
    }

    const { availability } = parseResult.data;

    try {
      const updated = await fastify.prisma.menuItem.update({
        where: { id },
        data: { availability },
        include: { category: true }
      });

      fastify.io?.emit("menu.updated");

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        category: updated.category.name,
        vegNonVeg: updated.vegNonVeg,
        availability: updated.availability
      };
    } catch (err) {
      return reply.status(404).send({ error: "Menu item not found" });
    }
  });

  // DELETE /api/v1/menu/:id
  fastify.delete("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid menu item ID" });
    }

    try {
      await fastify.prisma.menuItem.delete({
        where: { id }
      });

      fastify.io?.emit("menu.updated");

      return { success: true };
    } catch (err) {
      return reply.status(404).send({ error: "Menu item not found" });
    }
  });
}
