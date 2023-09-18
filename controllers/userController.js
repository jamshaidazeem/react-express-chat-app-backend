const mongoose = require("mongoose");
const userSchema = require("../models/User");

const User = mongoose.model("User", userSchema);

const createUser = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser };
