// @ts-nocheck
// utils/sendNotification.js
import Notification from "../models/Notification.js";

let ioRef = null;

export function setupSocketIO(io) {
  ioRef = io;
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId); // room per user
    });

    socket.on("sendMessage", async (payload) => {
      // payload: { senderId, receiverId, text }
      io.to(payload.receiverId).emit("newMessage", payload);

      // Optionally save notification
      await Notification.create({
        userId: payload.receiverId,
        type: "message",
        message: payload.text,
        data: payload,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.id);
    });
  });
}

export function emitToUser(userId, event, payload) {
  try {
    if (!ioRef) return;
    ioRef.to(String(userId)).emit(event, payload);
  } catch (e) {
    console.error('[socket] emit error', e?.message);
  }
}
