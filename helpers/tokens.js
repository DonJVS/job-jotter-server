function createToken(user) {
  if (!user.username || user.isAdmin === undefined) {
    throw new Error("createToken passed user without required properties");
  }

  let payload = {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, SECRET_KEY);
}
