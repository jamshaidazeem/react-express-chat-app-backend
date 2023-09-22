const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const messageSchema = require("../models/Message");
const Message = mongoose.model("Message", messageSchema);

const helper = require("../helper");
const { authenticationMiddleware } = require("../middlewares/authenticator");

router.use(authenticationMiddleware);

router.get("/", async (req, res, next) => {
  const senderId = req.query.senderId;
  const recieverId = req.query.recieverId;

  try {
    // find all messages against matching sender id and reciever id

    const orConditions = [
      { senderId: senderId, recieverId: recieverId },
      { senderId: recieverId, recieverId: senderId },
    ];

    const messages = await Message.find({
      $or: orConditions,
    });

    res.status(200).json({
      message: "messages list fetched successfully",
      data: messages && messages.length ? messages : [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/create", async (req, res, next) => {
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
