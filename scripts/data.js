// const mongoose = require("mongoose");
// const User = require("./path/to/userModel"); // Update with the actual path to your user model
// const bcrypt = require("bcryptjs");

// // Connect to MongoDB
// mongoose
//   .connect("mongodb://localhost:27017/yourDatabase", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// const dummyUsers = [
//   {
//     username: "Ashish_22",
//     fullName: "Ashish ",
//     email: "john@example.com",
//     password: "password123",
//     bio: "Software Developer",
//     profilePicture: "https://example.com/john.jpg",
//     isVerified: true,
//     location: "New York, USA",
//     dob: new Date("1990-05-15"),
//     gender: "male",
//   },
//   {
//     username: "tushar_23",
//     fullName: "Jane Smith",
//     email: "jane@example.com",
//     password: "password123",
//     bio: "Graphic Designer",
//     profilePicture: "https://example.com/jane.jpg",
//     isPrivate: true,
//     location: "Los Angeles, USA",
//     dob: new Date("1995-08-20"),
//     gender: "female",
//   },
// ];

// const seedUsers = async () => {
//   try {
//     // Hash passwords
//     for (let user of dummyUsers) {
//       const salt = await bcrypt.genSalt(10);
//       user.password = await bcrypt.hash(user.password, salt);
//     }

//     await User.insertMany(dummyUsers);
//     console.log("Dummy users added successfully");
//     mongoose.connection.close();
//   } catch (error) {
//     console.error("Error inserting dummy users:", error);
//     mongoose.connection.close();
//   }
// };

// seedUsers();

// dummyData.js
const mongoose = require("mongoose");
const User = require("../src/models/users");
const Post = require("../src/models/post");
const Comment = require("../src/models/comments");
const FriendRequest = require("../src/models/friendRequest");
const Chat = require("../src/models/chat");
const Message = require("../src/models/message");
const Job = require("../src/models/jobs");
const Tag = require("../src/models/tags");
const bcrypt = require("bcrypt");

// Connect to your MongoDB
mongoose.connect(
  "mongodb+srv://Ashish224:AshishKc225@ticketsys.b27zde6.mongodb.net/momento?retryWrites=true&w=majority&appName=TicketSys",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const fs = require("fs");
const path = require("path");

/**
 * Get a random image path from a folder
 * @param {string} folderPath - Absolute or relative path to the folder
 * @returns {string|null} - Random image path or null if none found
 */
function getRandomImagePath(folderPath) {
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  try {
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter((file) =>
      validExtensions.includes(path.extname(file).toLowerCase())
    );

    if (imageFiles.length === 0) return null;

    const randomFile =
      imageFiles[Math.floor(Math.random() * imageFiles.length)];
    return path.join(folderPath.replaceAll("../", ""), randomFile);
  } catch (err) {
    console.error("Error reading image folder:", err);
    return null;
  }
}

// const profileImages = [
//   "https://example.com/images/user1.jpg",
//   "https://example.com/images/user2.jpg",
//   "https://example.com/images/user3.jpg",
// ];
// const postImages = ["uploads/posts/test1.jpg"];
const length = 3;
async function insertDummyData() {
  try {
    // await mongoose.connection.dropDatabase();
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("gta123456", salt);
    // 1. Users
    const users = await User.insertMany(
      Array.from({ length: 9 }).map((_, i) => ({
        username: `user${i}`,
        fullName: `User ${i}`,
        email: `user${i}@test.com`,
        password: password,
        profilePicture: getRandomImagePath("../uploads/profileImages"),
        gender: ["male", "female", "other"][i % 3],
      }))
    );

    // 2. Posts
    const posts = await Post.insertMany(
      Array.from({ length: 5 }).map((_, i) => ({
        user: users[i % users.length]._id,
        text: `Test post ${i}`,
        image: getRandomImagePath("../uploads/posts"),
        likes: [],
      }))
    );

    // Update user posts
    await Promise.all(
      users.map((user, idx) => {
        const postIds = posts
          .filter((_, i) => i % users.length === idx)
          .map((p) => p._id);
        return User.findByIdAndUpdate(user._id, { posts: postIds });
      })
    );

    // 3. Comments
    const comments = await Promise.all(
      posts.map((post, i) =>
        Comment.create({
          post: post._id,
          user: users[i % users.length]._id,
          text: `Comment on post ${i}`,
        }).then((comment) => {
          post.comments.push(comment._id);
          return post.save();
        })
      )
    );

    // 4. Friend Request
    await FriendRequest.create({
      sender: users[0]._id,
      receiver: users[1]._id,
      status: "pending",
    });

    // 5. Tags
    const tags = await Tag.find();

    // 6. Jobs
    await Job.insertMany(
      Array.from({ length: 2 }).map((_, i) => ({
        title: `Job Title ${i}`,
        description: `Description for job ${i}`,
        location: "City A",
        createdBy: users[i % users.length]._id,
        tags: tags.map((tag) => tag._id).slice(0, 2),
        applicants: [users[1]._id],
      }))
    );

    // 7. Chat and Messages
    const chat = await Chat.create({
      name: "Group Chat",
      members: users.map((u) => u._id),
      isGroup: true,
      createdBy: users[0]._id,
    });

    await Message.create({
      chatId: chat._id,
      sender: users[0]._id,
      receiverId: users[1]._id,
      text: "Hey! This is a test message.",
    });

    console.log("✅ Dummy data inserted successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error inserting dummy data:", err);
    mongoose.disconnect();
  }
}

// console.log(getRandomImagePath("../uploads/profileImages"));

insertDummyData();
