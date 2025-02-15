const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const socketHandler = require("./src/socket/socketEvents");
const env = require("./src/config/env");

const PORT = env.server.port || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSockets
const io = new Server(server, { cors: { origin: "*" } });
socketHandler(io);

// Start the Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
