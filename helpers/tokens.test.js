const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
  test("works: not admin", function () {
    const token = createToken({ username: "test", isAdmin: false });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });

  test("works: admin", function () {
    const token = createToken({ username: "test", isAdmin: true });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: true,
    });
  });

  test("works: default no admin", function () {
    const token = createToken({ username: "test" }); // No isAdmin provided
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      id: undefined,  // Default behavior if no `id` is provided
      iat: expect.any(Number),
      username: "test",
      isAdmin: false, // Defaults to false
    });
  });

  test("throws error with missing username", function () {
    expect(() => createToken({})).toThrowError();
  }); 
});