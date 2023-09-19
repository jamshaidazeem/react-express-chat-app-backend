const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const userSchema = require("../models/User");
const bcrypt = require("bcryptjs");

const User = mongoose.model("User", userSchema);

router.post("/", async (req, res, next) => {
  try {
    // check if the user is already exists using given email OR chat name
    const userWithEmail = await User.findOne({ email: req.body.email });
    if (userWithEmail) {
      const error = new Error(
        `User with email: ${req.body.email} already exists`
      );
      error.statusCode = 400;
      throw error;
    }
    const userWithChatName = await User.findOne({
      chatName: req.body.chatName,
    });
    if (userWithChatName) {
      const error = new Error(
        `User with chat name: ${req.body.chatName} already exists`
      );
      error.statusCode = 400;
      throw error;
    }
    // create hased password to save in database
    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(req.body.password, salt);
    const user = new User({ ...req.body, password: hasedPassword });
    const savedUser = await user.save();
    // send an verification email
    res.json(savedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
