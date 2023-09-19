const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const userSchema = require("../models/User");
const bcrypt = require("bcryptjs");

const User = mongoose.model("User", userSchema);

const mailer = require("../mailer");
const helper = require("../helper");

router.post("/", async (req, res, next) => {
  try {
    // check if the user is already exists using given email OR chat name
    const userWithEmail = await User.findOne({ email: req.body.email });
    if (userWithEmail) {
      throw helper.createErrorObj(
        `User with email: ${req.body.email} already exists`,
        400
      );
    }
    const userWithChatName = await User.findOne({
      chatName: req.body.chatName,
    });
    if (userWithChatName) {
      throw helper.createErrorObj(
        `User with chat name: ${req.body.chatName} already exists`,
        400
      );
    }
    // create hased password to save in database
    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(req.body.password, salt);
    const user = new User({
      ...req.body,
      password: hasedPassword,
    });
    const savedUser = await user.save();
    // send verification email
    const verificationToken = await bcrypt.hash(savedUser._id.toString(), salt);
    try {
      const info = await mailer.sendVerificationEmail(
        savedUser.email,
        verificationToken
      );

      // save verification token and verification token expiry in user
      const updatedUser = await User.findOneAndUpdate(
        { _id: savedUser._id },
        {
          verificationToken: verificationToken,
          verificationTokenExpiry: Date.now() + 36000000,
        }
      );

      if (updatedUser) {
        // send response
        res.json({ email: savedUser.email });
      } else {
        throw helper.createErrorObj(
          `Something went wrong in user updation!`,
          500
        );
      }
    } catch (err) {
      throw helper.createErrorObj(
        `Something went wrong in sending email!`,
        500
      );
    }
  } catch (error) {
    next(error);
  }
});

router.post("/verifyEmail", async (req, res, next) => {
  const token = req.body.token;
  try {
    // find user with token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });
    if (user) {
      user.isVerified = true;
      user.verificationToken = "";
      user.verificationTokenExpiry = null;
      await user.save();
      res.status(200).json({ message: "user verified successfully" });
    } else {
      throw helper.createErrorObj(`verification token is not valid!`, 400);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
