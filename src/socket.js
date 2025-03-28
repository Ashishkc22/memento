const socketIo = require("socket.io");
const Chat = require("./models/chat");
const { auth } = require("./middlewares");

let io;

const socketSetup = (server) => {
  const io = socketIo(server, {
    cors: { origin: "*" },
  });

  io.use(auth);

  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    socket.on("join_chat", async (chatId) => {
      socket.join(chatId);
    });

    socket.on("send_message", async (messageData) => {
      io.to(messageData.chatId).emit("receive_message", messageData);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { socketSetup, getIO };
