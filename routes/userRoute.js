const userController = require("../controllers/userController");

const express = require("express");
const router = express.Router();

router.post("/", function (req, res, next) {
  userController.createUser(req, res);
});

module.exports = router;
