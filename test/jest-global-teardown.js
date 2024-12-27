// test/setup/jest-global-teardown.js
const common = require('./common/_testCommon');

module.exports = async () => {
  // Clean up the database and other resources
  await common.commonAfterAll();

  // Close the server
  if (global.__TEST_SERVER__) {
    await new Promise((resolve, reject) => {
      global.__TEST_SERVER__.close((err) => {
        if (err) return reject(err);
        console.log('Test server closed');
        resolve();
      });
    });
  }
};
