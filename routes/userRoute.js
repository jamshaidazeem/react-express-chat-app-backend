const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const userSchema = require("../models/User");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const User = mongoose.model("User", userSchema);

const mailer = require("../mailer");
const helper = require("../helper");
const { authenticationMiddleware } = require("../middlewares/authenticator");

router.post("/signup", async (req, res, next) => {
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

router.post("/login", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({
      email: email,
    });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw helper.createErrorObj(`password is not correct!`, 400);
      }
      if (!user.isVerified) {
        throw helper.createErrorObj(
          `you status is not verified!, please follow instructions in verify email sent to you!`,
          400
        );
      }
      // authentication logic
      const tokenData = {
        id: user._id,
        email: user.email,
        chatName: user.chatName,
      };
      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET + "", {
        expiresIn: "1d",
      });
      res.cookie("token", token, { httpOnly: true, path: "/" });
      res.cookie("tokenData", JSON.stringify(tokenData), {
        httpOnly: false,
        path: "/",
      });
      // send response
      res.status(200).json({ message: "user logged in successfully" });
    } else {
      throw helper.createErrorObj(`email is not correct!`, 400);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/forgotPassword", async (req, res, next) => {
  try {
    // check if the user is already exists using given email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw helper.createErrorObj(
        `User with email: ${req.body.email} not exists`,
        400
      );
    }
    // send forgot password email
    const salt = await bcrypt.genSalt(10);
    const verificationToken = await bcrypt.hash(user._id.toString(), salt);
    try {
      const info = await mailer.sendForgotPasswordEmail(
        user.email,
        verificationToken
      );

      // save verification token and verification token expiry in user
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          forgotPassToken: verificationToken,
          forgotPassTokenExpiry: Date.now() + 36000000,
        }
      );

      if (updatedUser) {
        // send response
        res.json({ email: updatedUser.email });
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

router.post("/newPassword", async (req, res, next) => {
  const token = req.body.token;
  const newPassword = req.body.newPassword;

  try {
    // find user with token
    const user = await User.findOne({
      forgotPassToken: token,
      forgotPassTokenExpiry: { $gt: Date.now() },
    });
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
      user.forgotPassToken = "";
      user.forgotPassTokenExpiry = null;
      await user.save();
      res.status(200).json({ message: "password set successfully" });
    } else {
      throw helper.createErrorObj(`token is not valid!`, 400);
    }
  } catch (error) {
    next(error);
  }
});

router.use(authenticationMiddleware);

router.get("/detail/:id", async (req, res, next) => {
  const userId = req.params.id;

  try {
    // find user with id
    const user = await User.findOne(
      { _id: userId },
      {
        _id: 1,
        age: 1,
        chatName: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        createdAt: 1,
        isVerified: 1,
      }
    );
    if (!user) {
      throw helper.createErrorObj(`user not found!`, 400);
    }
    res
      .status(200)
      .json({ message: "user detail fetched successfully", data: user });
  } catch (error) {
    next(error);
  }
});

router.post("/resetPassword", async (req, res, next) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  const tokenData = req.tokenData;

  try {
    // find user with email
    const user = await User.findOne({ email: tokenData.email });
    if (!user) {
      throw helper.createErrorObj(`user not found!`, 400);
    }
    // check if current password is valid
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw helper.createErrorObj(`current password is not correct!`, 400);
    }
    // save updated password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    res.clearCookie("token", { httpOnly: true, path: "/" });
    res.clearCookie("tokenData", { httpOnly: false, path: "/" });
    // send response
    res.status(200).json({ message: "user logged out successfully" });
  } catch (error) {
    next(error);
  }
});

router.put("/update/:id", async (req, res, next) => {
  const userId = req.params.id;

  try {
    // find user with id
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw helper.createErrorObj(`user not found!`, 400);
    }
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.age = req.body.age;
    await user.save();

    const updatedUser = await User.findOne(
      { _id: userId },
      { _id: 1, email: 1, firstName: 1, lastName: 1, age: 1, chatName: 1 }
    );

    res
      .status(200)
      .json({ message: "user updated successfully", data: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.get("/chatUsers/:userId", async (req, res, next) => {
  const userId = req.params.userId;

  try {
    // find all users except the user matching the userId
    const users = await User.find(
      { _id: { $ne: userId } },
      {
        _id: 1,
        age: 1,
        chatName: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        createdAt: 1,
        isVerified: 1,
      }
    );
    if (!users) {
      throw helper.createErrorObj(`users not found!`, 400);
    }
    res
      .status(200)
      .json({ message: "users list fetched successfully", data: users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
