const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    // unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  chatName: {
    type: String,
    required: true,
    // unique: true,
  },
  age: {
    type: Number,
    default: 18,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: "",
  },
  verificationTokenExpiry: {
    type: Date,
    default: null,
  },
  forgotPassToken: {
    type: String,
    default: "",
  },
  forgotPassTokenExpiry: {
    type: Date,
    default: null,
  },
});

module.exports = userSchema;
