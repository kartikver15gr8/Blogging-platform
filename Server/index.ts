// Blog API: Develop a blogging platform's backend where users can create, update, and delete posts. Implement features like user authentication, comments, tags, and the ability to like or bookmark posts.

import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import cors, { CorsOptions } from "cors";
import mongoose, { ObjectId } from "mongoose";
// const fs = require("fs");
const port = 3000;
const app = express();

app.use(express.json());

// Defining Mongoose Schemas

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blogs" }],
});

const blogSchema = new mongoose.Schema({
  title: String,
  description: String,
  imgLink: String,
  mainBlog: String,
});

// Defining Mongoose Models

const Admins = mongoose.model("Admins", adminSchema);
const Users = mongoose.model("Users", userSchema);
const Blogs = mongoose.model("Blogs", blogSchema);

// For Users Authentication
const SECRET_KEY = "MyBloggingPlatform!";

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, payload) => {
      if (err) {
        return res.sendStatus(403);
      }

      if (!payload) {
        return res.sendStatus(403);
      }
      if (typeof payload === "string") {
        return res.sendStatus(403);
      }

      req.headers["user"] = payload.email;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// For Admins Authentication
const SECRET_FOR_ADMIN = "WeAreAdminsBuddy";

const authenticateAdmins = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, SECRET_FOR_ADMIN, (err, payload) => {
      if (err) {
        return res.sendStatus(403);
      }
      if (!payload) {
        return res.sendStatus(403);
      }
      if (typeof payload === "string") {
        return res.sendStatus(403);
      }

      req.headers["admin"] = payload.email;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Connect to MongoDB

mongoose.connect(
  "mongodb+srv://Kartik:M6I1SRXOHJRS3DhA@cluster0.vioh21c.mongodb.net/BlogApp",
  { dbName: "BlogApp" }
);

// mongoose.connect("mongodb://localhost:27017");

// Admins Signup

let adminSignupBody = z.object({
  name: z.string().min(0).max(100),
  email: z.string().min(0).max(100),
  password: z.string().min(0).max(100),
});

app.post("/admin/signup", async (req, res) => {
  const userCreds = adminSignupBody.safeParse(req.body);

  if (!userCreds.success) {
    return res.status(411).json({ msg: "Invalid Inputs" });
  }

  const name: string = userCreds.data.name;
  const email: string = userCreds.data.email;
  const password: string = userCreds.data.password;

  // let existingUser = false;
  const admin = await Admins.findOne({ email });

  if (admin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    const obj = { name: name, email: email, password: password };
    const newAdmin = new Admins(obj);
    newAdmin.save();
    const token = jwt.sign({ email, role: "admin" }, SECRET_FOR_ADMIN, {
      expiresIn: "1h",
    });
    res
      .status(200)
      .json({ message: "Admin has been created successfully!", token });
  }
});

// Admins Login

app.post("/admin/login", async (req, res) => {
  const userCreds = adminSignupBody.safeParse(req.body);

  if (!userCreds.success) {
    return res.status(411).json({ msg: "Your inputs are errenous!" });
  }

  const email = userCreds.data.email;
  const password = userCreds.data.password;

  const admin = await Admins.findOne({ email, password });

  if (admin) {
    const token = jwt.sign({ email, role: "admin" }, SECRET_FOR_ADMIN, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Admin logged in Successfully", token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }
});

// Get All Users
app.get("/admin/allusers", authenticateAdmins, async (req, res) => {
  const users = await Users.find({});
  res.status(200).send(users);
});

// ---------------- Below are Users Routes ----------------------

// Users Signup Route

let userSignupBody = z.object({
  name: z.string().min(1).max(100),
  email: z.string().min(1).max(100),
  password: z.string().min(1).max(100),
});

app.post("/users/signup", async (req, res) => {
  const userCreds = userSignupBody.safeParse(req.body);

  if (!userCreds.success) {
    return res.status(411).json({ message: "Erronous Inputs!" });
  }

  let email: string = userCreds.data.email;
  let name: string = userCreds.data.name;
  let password: string = userCreds.data.password;

  const user = await Users.findOne({ email });

  if (user) {
    res.status(403).send("User already exists!");
  } else {
    const obj = { name: name, email: email, password: password, blogs: [] };
    const newUser = new Users(obj);
    newUser.save();

    const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .json({ message: "User has been created successfully!", token });
  }
});

// Login route

app.post("/users/login", async (req, res) => {
  const userCreds = req.body;
  let email = userCreds.email;
  let password = userCreds.password;

  const user = await Users.findOne({ email, password });

  if (user) {
    const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "User logged in successfully!", token });
  } else {
    res.status(403).send("Invalid Creds!");
  }
});

// Route for creating Blog!

app.post("/users/craft", authenticateJWT, async (req, res) => {
  const email = req.headers["user"];
  const user = await Users.findOne({ email: email });

  if (user) {
    const blog = new Blogs(req.body);
    await blog.save();

    user.blogs.push(blog._id);
    await user.save();
    res.status(200).json({ message: "Blog published successfully!" });
  } else {
    res.status(401).send("Failed");
  }
});

// Get All Blogs

app.get("/users/blogs", authenticateJWT, async (req, res) => {
  const blogs = await Blogs.find({});
  res.status(200).send(blogs);
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
