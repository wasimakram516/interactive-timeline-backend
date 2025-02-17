const Timeline = require("../models/Timeline");

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log(`🔵 New client connected: ${socket.id}`);

    // ✅ Fetch timeline from database and send it to new clients immediately
    const sendTimelineUpdate = async () => {
      const timelines = await Timeline.find().sort({ year: 1 });
      io.emit("timelineUpdate", timelines); // Send to all connected clients
    };

    await sendTimelineUpdate(); // ✅ Send timeline to new connections

    // ✅ Register roles
    socket.on("register", (role) => {
      socket.role = role;
      console.log(`👤 Client ${socket.id} registered as ${role}`);
    });

    // ✅ Handle year selection
    socket.on("selectYear", async (year) => {
      console.log(`📅 Year selected: ${year}`);
      const eventData = await Timeline.findOne({ year });

      if (eventData) {
        io.emit("animateYear", eventData); // Send selected year to all screens
      }
    });

    // ✅ Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
