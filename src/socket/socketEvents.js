module.exports = (io) => {
    io.on("connection", (socket) => {
      console.log("🔵 Client connected:", socket.id);
  
      socket.on("yearSelected", (data) => {
        console.log("📅 Year selected:", data);
        io.emit("updateDisplay", data);
      });
  
      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });
  };
  