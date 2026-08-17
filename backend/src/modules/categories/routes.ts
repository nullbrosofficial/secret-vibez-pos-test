import { FastifyInstance } from "fastify";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1)
});

export default async function categoryRoutes(fastify: FastifyInstance) {
  // GET /api/v1/categories
  fastify.get("/", async (request, reply) => {
    const list = await fastify.prisma.menuCategory.findMany({
      orderBy: { name: "asc" }
    });
    return list;
  });

  // POST /api/v1/categories
  fastify.post("/", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const parseResult = categorySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid name", details: parseResult.error.format() });
    }

    const { name } = parseResult.data;

    // Check if category already exists
    const existing = await fastify.prisma.menuCategory.findUnique({
      where: { name }
    });
    if (existing) {
      return reply.status(409).send({ error: "Category already exists" });
    }

    const category = await fastify.prisma.menuCategory.create({
      data: { name }
    });

    return category;
  });

  // PUT /api/v1/categories/:id
  fastify.put("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid category ID" });
    }

    const parseResult = categorySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid name", details: parseResult.error.format() });
    }

    const { name } = parseResult.data;

    try {
      const updated = await fastify.prisma.menuCategory.update({
        where: { id },
        data: { name }
      });
      return updated;
    } catch (err) {
      return reply.status(404).send({ error: "Category not found" });
    }
  });

  // DELETE /api/v1/categories/:id
  fastify.delete("/:id", {
    preHandler: [fastify.authenticate, fastify.checkRole(["OWNER"])]
  }, async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({ error: "Invalid category ID" });
    }

    try {
      // Check if there are menu items in this category
      const count = await fastify.prisma.menuItem.count({
        where: { categoryId: id }
      });
      if (count > 0) {
        return reply.status(400).send({ error: "Cannot delete category containing menu items" });
      }

      await fastify.prisma.menuCategory.delete({
        where: { id }
      });
      return { success: true };
    } catch (err) {
      return reply.status(404).send({ error: "Category not found" });
    }
  });
}
