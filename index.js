const express = require("express");
const path = require("path");
const app = require("express")();

const cors = require("cors");
require("dotenv").config();
const { socketSetup } = require("./src/socket");

async function startServer() {
  try {
    const { connectDB } = require("./DB");
    await connectDB();
  } catch (error) {
    throw error;
  }

  //body parser
  const bodyParser = require("body-parser");
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  // parse application/json
  app.use(bodyParser.json());
  app.use(cors());

  // Routes
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/api/v1", require("./src/routes"));
  const server = require("http").createServer(app);
  socketSetup(server);
  // const { Server } = require("socket.io");
  // const io = new Server(server, {
  //   path: "/",
  //   cors: {
  //     origin: "*",
  //   },
  //   methods: ["GET", "POST"],
  //   /* options */
  // });
  // console.log("Socket.io initialized");
  // io.on("connection", (socket) => {
  //   console.log("New user connected:", socket.id);
  // });

  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log("application running on Port: ", PORT || 3000);
  });
}

startServer();
