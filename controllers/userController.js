const mongoose = require("mongoose");
const userSchema = require("../models/User");

const createUser = (req, res) => {
  console.log("🚀 ~ file: userController.js:5 ~ createUser ~ req:", req.body);
  res.json(req.body);
};

module.exports = { createUser };
