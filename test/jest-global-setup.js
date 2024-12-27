// test/setup/jest-global-setup.js
const app = require('../app');
const http = require('http');
const modelsTestCommon = require('./common/models/_testCommon');
const routesTestCommon = require('./common/routes/_testCommon');
const dotenv = require('dotenv');

module.exports = async () => {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  // Start the server on a dynamic port to avoid conflicts
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, () => { // 0 assigns a random available port
      const { port } = server.address();
      global.__TEST_SERVER_PORT__ = port;
      global.__TEST_SERVER__ = server;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
    server.on('error', reject);
  });

  // Perform model-specific setup
  await modelsTestCommon.commonBeforeAllModels();

  // Perform route-specific setup (if needed)
  await routesTestCommon.commonBeforeAllRoutes();
};