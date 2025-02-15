const http = require("http");
const app = require("./src/app");
const env = require("./src/config/env");

const PORT = env.server.port || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Start the Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
