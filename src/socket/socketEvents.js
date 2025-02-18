const Timeline = require("../models/Timeline");
const Program = require("../models/Program");

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log(`🔵 New client connected: ${socket.id}`);

    // ✅ Fetch timeline & programs from the database and send to new clients
    const sendDataUpdate = async () => {
      const timelines = await Timeline.find().sort({ year: 1 });
      const programs = await Program.find().sort({ title: 1 });

      io.emit("timelineUpdate", timelines); // Send timeline updates
      io.emit("programUpdate", programs);   // Send program updates
    };

    await sendDataUpdate(); // ✅ Send initial data to new connections

    // ✅ Register roles
    socket.on("register", (role) => {
      socket.role = role;
      console.log(`👤 Client ${socket.id} registered as ${role}`);
    });

    // ✅ Handle year selection for timeline
    socket.on("selectYear", async (year) => {
      console.log(`📅 Year selected: ${year}`);
      const eventData = await Timeline.findOne({ year });

      if (eventData) {
        io.emit("animateYear", eventData); // Send selected year to all screens
      }
    });

    // ✅ Handle program title selection
    socket.on("selectProgram", async (title) => {
      console.log(`📜 Program selected: ${title}`);
      const programData = await Program.findOne({ title });

      if (programData) {
        io.emit("animateProgram", programData); // Send selected program to all screens
      }
    });

    // ✅ Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
