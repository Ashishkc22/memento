const mongoose = require("mongoose");
const User = require("./path/to/userModel"); // Update with the actual path to your user model
const bcrypt = require("bcryptjs");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/yourDatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const dummyUsers = [
  {
    username: "Ashish_22",
    fullName: "Ashish ",
    email: "john@example.com",
    password: "password123",
    bio: "Software Developer",
    profilePicture: "https://example.com/john.jpg",
    isVerified: true,
    location: "New York, USA",
    dob: new Date("1990-05-15"),
    gender: "male",
  },
  {
    username: "tushar_23",
    fullName: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    bio: "Graphic Designer",
    profilePicture: "https://example.com/jane.jpg",
    isPrivate: true,
    location: "Los Angeles, USA",
    dob: new Date("1995-08-20"),
    gender: "female",
  },
];

const seedUsers = async () => {
  try {
    // Hash passwords
    for (let user of dummyUsers) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    await User.insertMany(dummyUsers);
    console.log("Dummy users added successfully");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error inserting dummy users:", error);
    mongoose.connection.close();
  }
};

seedUsers();
