// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { swaggerDocs } from "./config/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import measureRoutes from "./routes/measureRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adviceRoutes from "./routes/adviceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import geolocationRoutes from "./routes/geolocationRoutes.js";
import ficheRoutes from "./routes/ficheDeSanteRoutes.js";
import ordonnanceRoutes from "./routes/ordonnanceRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";
import { setupSocketIO } from "./utils/sendNotification.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import userRoutes from "./routes/userRoutes.js";

const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));


// App & server
const app = express();
const server = http.createServer(app);

// ✅ ES module-compatible socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/measures", measureRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/advices", adviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/geolocation", geolocationRoutes);
app.use("/api/fiches", ficheRoutes);
app.use("/api/ordonnance", ordonnanceRoutes);
app.use("/api/users", userRoutes);

// Error handler
app.use(errorHandler);

// Socket setup
setupSocketIO(io);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Start server
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGODB_URI).then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});


let users = [];

// Ajouter un utilisateur connecté
io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté : ", socket.id);

  socket.on("join", (userId) => {
    users.push({ userId, socketId: socket.id });
  });

  // Réception d’un message et rediffusion
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiver = users.find((u) => u.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((u) => u.socketId !== socket.id);
  });
});

server.listen(5000, () => console.log("Serveur démarré sur le port 5000"));
