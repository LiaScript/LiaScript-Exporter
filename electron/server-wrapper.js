/**
 * Electron-specific server starter
 * 
 * This module starts the Fastify server for Electron by requiring
 * the TypeScript source files directly using ts-node.
 */

const path = require('path');

// Register ts-node to handle TypeScript files
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Now we can require TypeScript files
const { startServer: originalStartServer } = require('../src/server/server.ts');

/**
 * Start server and return the Fastify instance
 * Uses port 0 to let the OS assign an available port automatically
 * @returns {Promise<any>} Fastify instance
 */
async function startServer() {
  try {
    // Use port 0 to let OS assign an available port
    const fastifyInstance = await originalStartServer(0, true);
    return fastifyInstance;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

module.exports = { startServer };
