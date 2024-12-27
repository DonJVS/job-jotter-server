// __mocks__/@google-cloud/local-auth.js
module.exports = {
  authenticate: jest.fn().mockResolvedValue(null), // Prevent actual server start
  loadSavedCredentialsIfExist: jest.fn().mockResolvedValue(null),
};
