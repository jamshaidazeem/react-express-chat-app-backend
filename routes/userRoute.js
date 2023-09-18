const userController = require("../controllers/userController");

const express = require("express");
const router = express.Router();

router.post("/", async (req, res, next) => {
  await userController.createUser(req, res, next);
});

module.exports = router;
