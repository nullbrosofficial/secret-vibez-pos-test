import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import dbPlugin from "./plugins/db";
import { Server } from "socket.io";

// Modules
import authRoutes from "./modules/auth/routes";
import categoryRoutes from "./modules/categories/routes";
import menuRoutes from "./modules/menu/routes";
import tableRoutes from "./modules/tables/routes";
import orderRoutes from "./modules/orders/routes";
import paymentRoutes from "./modules/payments/routes";
import customerRoutes from "./modules/customers/routes";
import dashboardRoutes from "./modules/dashboard/routes";
import reportsRoutes from "./modules/reports/routes";
import settingsRoutes from "./modules/settings/routes";
import billRoutes from "./modules/bills/routes";
import userRoutes from "./modules/users/routes";

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    checkRole: (allowedRoles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      sub: number;
      role: string;
      email: string;
      name: string;
    };
  }
}

export function buildApp(): FastifyInstance {
  const isTest = process.env.NODE_ENV === "test";

  const fastify = Fastify({
    logger: isTest ? false : {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname"
        }
      }
    }
  });

  // CORS setup
  fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  });

  // JWT setup
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "secret-vibez-pos-super-secure-token-sign-key-2026"
  });

  // Database plugin
  fastify.register(dbPlugin);

  // Security Decorators
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Unauthenticated" });
    }
  });

  fastify.decorate("checkRole", (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user || !allowedRoles.includes(user.role.toUpperCase())) {
        reply.status(403).send({ error: "Unauthorized" });
      }
    };
  });

  // Global error handler
  fastify.setErrorHandler((error: any, request, reply) => {
    if (isTest) {
      console.error("FASTIFY ERROR:", error);
    } else {
      fastify.log.error(error);
    }
    
    if (error.validation) {
      return reply.status(422).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: error.name || "Error",
        message: error.message
      });
    }

    reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred"
    });
  });

  // Register Routes
  fastify.register(async (api) => {
    api.register(authRoutes, { prefix: "/auth" });
    api.register(categoryRoutes, { prefix: "/categories" });
    api.register(menuRoutes, { prefix: "/menu" });
    api.register(tableRoutes, { prefix: "/tables" });
    api.register(orderRoutes, { prefix: "/orders" });
    api.register(paymentRoutes, { prefix: "/payments" });
    api.register(customerRoutes, { prefix: "/customers" });
    api.register(dashboardRoutes, { prefix: "/dashboard" });
    api.register(reportsRoutes, { prefix: "/reports" });
    api.register(settingsRoutes, { prefix: "/settings" });
    api.register(billRoutes, { prefix: "/bills" });
    api.register(userRoutes, { prefix: "/users" });
  }, { prefix: "/api/v1" });

  return fastify;
}
