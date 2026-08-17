import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { buildApp } from "./app";
import { Server } from "socket.io";

const start = async () => {
  const app = buildApp();
  const port = parseInt(process.env.PORT || "3000", 10);

  try {
    // Attach Socket.IO to HTTP server
    const io = new Server(app.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
      }
    });

    // Share socket.io globally through fastify instance
    app.decorate("io", io);

    io.on("connection", (socket) => {
      app.log.info(`Socket connected: ${socket.id}`);

      socket.on("join-room", (room) => {
        socket.join(room);
        app.log.info(`Socket ${socket.id} joined room: ${room}`);
      });

      socket.on("disconnect", () => {
        app.log.info(`Socket disconnected: ${socket.id}`);
      });
    });

    await app.ready();
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Server is running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
