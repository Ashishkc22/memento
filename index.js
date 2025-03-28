const app = require("express")();
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

  // Routes
  app.use("/api/v1", require("./src/routes"));

  const server = require("http").createServer(app);
  const io = socketSetup(server);
  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log("application running on Port: ", PORT || 3000);
  });
}

startServer();
