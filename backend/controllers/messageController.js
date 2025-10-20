// controllers/messageController.js
import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = await Message.create({
      senderId,
      receiverId,
      text: content,
    });
    res.status(201).json({ message: "Message envoyé", data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
