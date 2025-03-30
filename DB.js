let dbConnection;

const defaultMongoUrl =
  "mongodb+srv://ashish224:44y10E00kubRK8lX@auth.ki2bc73.mongodb.net/?retryWrites=true&w=majority";

async function getDBconnection() {
  try {
    if (dbConnection) {
      return dbConnection;
    } else {
      dbConnection = await connectDB();
      return dbConnection;
    }
  } catch (error) {
    throw error;
  }
}

async function connectDB() {
  try {
    // require("dotenv").config();
    const mongoose = require("mongoose");
    mongoose.set("strictQuery", true);
    return await mongoose.connect(process.env.MONGO_DEV_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    throw error || new Error("Failed to connect to DB.");
  }
}
module.exports = {
  getDBconnection,
  connectDB,
};
