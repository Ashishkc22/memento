const { Server } = require("socket.io");
const Chat = require("./models/chat");
const Message = require("./models/message");

const { socketAuth, auth } = require("./middlewares");
const mongoose = require("mongoose");

let onlineUsers = {};

function formatmessage({ message, user, messageId, chatId }) {
  return {
    message,
    createdAt: new Date(),
    sender: user._id,
    senderName: user.name,
    messageId,
    chatId,
  };
}

let io;
// new chat - inset data in chat collection
// make entry in message collection
// old chat - skip chat insertion
//format and validate user text
//validate if user is allowed to send message.
//insert message in db (message collection)
//check is user is online if online send message delivery status
async function sendMessage({ socket, data }) {
  try {
    const { message, chatId, socketId } = data;
    const { user } = socket;
    if (message) {
      if (!chatId) {
        socket.emit("error", "chatId is required");
        return;
      }
      const chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
      });
      if (!chat) {
        socket.emit("error", `Chat with ${chatId} not found`);
        return;
      }
      if (!chat.members.includes(user._id)) {
        socket.emit("error", `Your not allowed to send message`);
        return;
      }
      const newMessage = new Message({
        sender: user._id,
        chatId: new mongoose.Types.ObjectId(chatId),
        text: message,
      });
      if (socketId) {
        socket
          .to(socketId)
          .emit(
            "receive_message",
            formatmessage({ ...data, messageId: newMessage._id, user })
          );
      }
      newMessage.save();
    }
  } catch (error) {
    socket.emit("error", "somthing went wrong");
  }
}
function sendMessageGroup({ socket, data }) {
  try {
    const { message, chatId, groupId } = data;
    const { user } = socket;
    // if (message) {
    //   if (!chatId) {
    //     socket.emit("error", "chatId is required");
    //     return;
    //   }
    //   const chat = await Chat.findOne({
    //     _id: new mongoose.Types.ObjectId(chatId),
    //   });
    //   if (!chat) {
    //     socket.emit("error", `Chat with ${chatId} not found`);
    //     return;
    //   }
    //   if (!chat.members.includes(user._id)) {
    //     socket.emit("error", `Your not allowed to send message`);
    //     return;
    //   }
    //   const newMessage = new Message({
    //     sender: user._id,
    //     chatId: new mongoose.Types.ObjectId(chatId),
    //     text: message,
    //   });
    //   if (socketId) {
    //     socket
    //       .to(socketId)
    //       .emit(
    //         "receive_message",
    //         formatmessage({ ...data, messageId: newMessage._id, user })
    //       );
    //   }
    //   newMessage.save();
    // }
    console.log("groupdId", groupId);
    console.log("message", message);
    socket.broadcast.to(groupId).emit("receive_group_message", {
      message,
      // sender: users[socket.id].username,
    });
  } catch (error) {
    socket.emit("error", "somthing went wrong");
  }
}
function joinGroup({ socket, data }) {
  try {
    const groupdId = data;
    const { user } = socket;
    socket.join(groupdId);
  } catch (error) {}
}
async function scoketConnectionHandler(socket) {
  console.log("User connected:", socket.id);
  onlineUsers[socket.user._id.toString()] = socket.id;
  // await registerUserSocketId({ user: socket.user, socketId: socket.id });
  socket.on("send_message", (data) => sendMessage({ socket, data }));
  socket.on("send_message_in_group", (data) =>
    sendMessageGroup({ socket, data })
  );
  // socket.on("", (data) => sendMessage({ socket, data }));
  socket.on("join_group", (data) => joinGroup({ socket, data }));
  socket.on("get_user", (id) => {
    socket.emit("user_socket_id", onlineUsers[id]) || null;
  });
}

const socketSetup = (server) => {
  io = new Server(server, {
    path: "/socket",
    cors: { origin: "*" },
  });
  io.use(socketAuth);
  console.log("Socket.io initialized");

  io.on("connection", scoketConnectionHandler);
  //   (socket) => {
  //     socket.on("join_chat", async (chatId) => {
  //       socket.join(chatId);
  //     });

  //     socket.on("send_message", async (messageData) => {
  //       console.log("send_message ", messageData);
  //       io.to(messageData.chatId).emit("receive_message", messageData.message);
  //     });

  //     socket.on("disconnect", () => {
  //       console.log("User disconnected:", socket.id);
  //     });
  //   });

  //   // return io;
};

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { socketSetup, getIO };
