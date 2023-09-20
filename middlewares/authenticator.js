const jwt = require("jsonwebtoken");

const authenticationMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  let isAuthenticated = false;
  if (token) {
    const tokenData = jwt.verify(token, process.env.TOKEN_SECRET);
    if (tokenData) {
      isAuthenticated = true;
      req.tokenData = tokenData; // save token data in request
    }
  }

  if (isAuthenticated) {
    next(); // send control to next middleware or route handler
  } else {
    res
      .status(401)
      .json({ message: "Your session has expired, please login again!" });
  }
};

module.exports = { authenticationMiddleware };
