const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const messageSchema = require("../models/Message");

const Message = mongoose.model("Message", messageSchema);

const helper = require("../helper");
const { authenticationMiddleware } = require("../middlewares/authenticator");

router.use(authenticationMiddleware);

router.post("/create", async (req, res, next) => {
  console.log("🚀 ~ file: messageRoute.js:15 ~ router.post ~ req:", req.body);
  const senderId = req.body.senderId;
  const recieverId = req.body.recieverId;
  const content = req.body.message;

  try {
    const msg = new Message({ ...req.body });
    msg.senderId = senderId;
    msg.recieverId = recieverId;
    msg.message = content;
    await msg.save();
    res.status(200).json({ message: "message created successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
