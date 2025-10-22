// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Récupérer les messages d'une conversation
router.get("/:chatId", async (req, res) => {
  try {
    const chat = await Chat.find({ chatId: req.params.chatId });
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Envoyer un message
router.post("/", async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;
    const chat = new Chat({ chatId, senderId, text });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
