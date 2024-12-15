const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function createToken(user) {
  if (!user.username) {
    throw new Error("createToken passed user without required properties");
  }

  let payload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  if (!JWT_SECRET) {
    throw new Error ("JWT_SECRET is not defined");
  }
  console.log("JWT_SECRET is loaded.")
  return jwt.sign(payload, JWT_SECRET);
}

module.exports = { createToken };