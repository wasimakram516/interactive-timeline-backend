const Timeline = require("../models/Timeline");
const Program = require("../models/Program");

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log(`🔵 New client attempted to connect: ${socket.id}`);

    // Detect connection errors
    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    // Send initial timeline & programs data
    const sendDataUpdate = async () => {
      try {
        const timelines = await Timeline.find().sort({ year: 1 });
        const programs = await Program.find().sort({ title: 1 });

        console.log("📢 Sending initial data to clients...");
        io.emit("timelineUpdate", timelines);
        io.emit("programUpdate", programs);
      } catch (error) {
        console.error("❌ Error fetching initial data:", error);
      }
    };

    await sendDataUpdate(); // ✅ Send data to new clients

    socket.on("register", (role) => {
      socket.role = role;
      console.log(`👤 Client ${socket.id} registered as ${role}`);
    });

    // ✅ Handle year selection for timeline
    socket.on("selectYear", async (year) => {
      console.log(`📅 Year selected: ${year}`);

      // Broadcast the selected year to ALL controllers
      io.emit("yearSelected", year);

      if (year === null) {
        io.emit("animateYear", null); // For big screens
        return;
      }

      const eventData = await Timeline.findOne({ year });
      if (eventData) {
        io.emit("animateYear", eventData); // For big screens
      } else {
        console.log(`❌ Year ${year} not found`);
      }
    });

    // ✅ Handle program title selection
    socket.on("selectProgram", async (title) => {
      console.log(`📜 Program selected: ${title}`);

      if (title === null) {
        // Emit null to unselect the title
        io.emit("animateProgram", null);
        return;
      }

      const programData = await Program.findOne({ title });

      if (programData) {
        io.emit("animateProgram", programData); // Send selected program to all screens
      } else {
        console.log(`❌ Title ${title} not found in the database`);
      }
    });

    // ✅ Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = socketHandler;
