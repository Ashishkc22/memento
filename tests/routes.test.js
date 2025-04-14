const request = require("supertest");
const app = require("../index"); // Import your Express app
const mongoose = require("mongoose");
const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

describe("User Routes", () => {
  let server;
  let token;
  let user;

  beforeAll(async () => {
    server = app.listen(4000);
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);
    user = await User.create({
      username: "testuser",
      fullName: "Test User",
      email: "test@example.com",
      password: hashedPassword,
    });

    token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  test("User signup - success", async () => {
    const res = await request(app).post("/api/user/signup").send({
      username: "newuser",
      fullName: "New User",
      email: "new@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  test("User login - success", async () => {
    const res = await request(app).post("/api/user/login").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user.token).toBeDefined();
  });

  test("User update - success", async () => {
    const res = await request(app)
      .put(`/api/user/update/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updatedUser" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Profile updated successfully");
    expect(res.body.user.username).toBe("updatedUser");
  });

  test("Forgot password - success", async () => {
    const res = await request(app).post("/api/user/forgot-password").send({
      email: "test@example.com",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("OTP sent to email");
  });

  test("Reset password - invalid OTP", async () => {
    const res = await request(app).post("/api/user/reset-password").send({
      email: "test@example.com",
      otp: "123456",
      newPassword: "newpassword123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid or expired OTP");
  });
});
