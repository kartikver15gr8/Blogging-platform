// Blog API: Develop a blogging platform's backend where users can create, update, and delete posts. Implement features like user authentication, comments, tags, and the ability to like or bookmark posts.

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs");
const port = 3000;
const app = express();

app.use(express.json());

// let USERS = [];
// let BLOGS = [];
// let ADMINS = [];

// try {
//   USERS = JSON.parse(fs.readFileSync("users.json", "utf8"));
//   BLOGS = JSON.parse(fs.readFileSync("blogs.json", "utf8"));
//   ADMINS = JSON.parse(fs.readFileSync("admins.json", "utf8"));
// } catch {
//   USERS = [];
//   BLOGS = [];
//   ADMINS = [];
// }

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

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// For Admins Authentication
const SECRET_FOR_ADMIN = "WeAreAdminsBuddy";

const authenticateAdmins = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, SECRET_FOR_ADMIN, (err, admin) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.admin = admin;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Connect to MongoDB

mongoose.connect(
  "mongodb+srv://Kartik:M6I1SRXOHJRS3DhA@cluster0.vioh21c.mongodb.net/BlogApp",
  { useNewUrlParser: true, useUnifiedTopology: true, dbName: "BlogApp" }
);

// mongoose.connect("mongodb://localhost:27017");

// Admins Signup

app.post("/admin/signup", async (req, res) => {
  const userCreds = req.body;
  const name = userCreds.name;
  const email = userCreds.email;
  const password = userCreds.password;

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

  // for (let elem of ADMINS) {
  //   if (elem.email === userCreds.email) {
  //     existingUser = true;
  //     break;
  //   }
  // }

  // if (existingUser) {
  //   res.status(402).send("Admin already exists with this creds!");
  // } else {
  //   let newAdmin = {
  //     name: userCreds.name,
  //     email: userCreds.email,
  //     password: userCreds.password,
  //   };

  //   const token = jwt.sign({ email, role: "admin" }, SECRET_FOR_ADMIN, {
  //     expiresIn: "1h",
  //   });

  //   ADMINS.push(newAdmin);
  //   fs.writeFileSync("admins.json", JSON.stringify(ADMINS));

  //   res
  //     .status(200)
  //     .json({ message: "Admin has been created successfully!", token });
  // }
});

// Admins Login

app.post("/admin/login", async (req, res) => {
  const userCreds = req.body;
  const email = userCreds.email;
  const password = userCreds.password;

  const admin = await Admins.findOne({ email, password });

  if (admin) {
    const token = jwt.sign({ email, role: "admin" }, SECRET_FOR_ADMIN, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Admin logged in Successfully", token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }

  // for (let elem of ADMINS) {
  //   if (
  //     elem.email === userCreds.email &&
  //     elem.password === userCreds.password
  //   ) {
  //     const token = jwt.sign({ email, role: "admin" }, SECRET_FOR_ADMIN, {
  //       expiresIn: "1h",
  //     });
  //     res.status(200).json({ message: "Logged in Successfullly", token });
  //   }
  // }

  // res.status(403).send("Invalid Credentials!");
});

// Get All Users
app.get("/admin/allusers", authenticateAdmins, (req, res) => {
  res.status(200).send(JSON.stringify(USERS));
});

// ---------------- Below are Users Routes ----------------------

// Users Signup Route

app.post("/users/signup", async (req, res) => {
  const { name, email, password } = req.body;

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

  // let existingUser = false;

  // for (let elem of USERS) {
  //   if (elem.email === userCreds.email) {
  //     existingUser = true;
  //     break;
  //   }
  // }

  // if (existingUser) {
  //   res.status(403).send("User already exists! Kindly login.");
  // } else {
  //   const newUser = {
  //     name: userCreds.name,
  //     email: userCreds.email,
  //     password: userCreds.password,
  //     blogs: [],
  //   };

  //   USERS.push(newUser);

  //   const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
  //     expiresIn: "1h",
  //   });

  //   fs.writeFileSync("users.json", JSON.stringify(USERS));
  //   res.status(200).json({ message: "User Created successfully!", token });
  // }
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

  // for (let elem of USERS) {
  //   if (
  //     elem.email === userCreds.email &&
  //     elem.password === userCreds.password
  //   ) {
  //     const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
  //       expiresIn: "1h",
  //     });
  //     res.status(200).json({ message: "User Logged in Successfully!", token });
  //   }
  // }

  // res.status(401).send("Invalid Credentials!");
});

// Route for creating Blog!

app.post("/users/craft", authenticateJWT, async (req, res) => {
  // const email = req.headers.email;
  const user = await Users.findOne({ email: req.user.email });

  if (user) {
    const blog = new Blogs(req.body);
    await blog.save();

    user.blogs.push(blog);
    await user.save();
    res.status(200).json({ message: "Blog published successfully!" });
  } else {
    res.status(401).send("Failed");
  }

  // if (blogBody) {
  //   let id = Math.floor(Math.random() * 100000);
  //   const newBlog = {
  //     id: id,
  //     title: blogBody.title,
  //     description: blogBody.description,
  //     imgLink: blogBody.imgLink,
  //     mainBlog: blogBody.mainBlog,
  //   };

  //   BLOGS.push(newBlog);
  //   fs.writeFileSync("blogs.json", JSON.stringify(BLOGS));

  //   for (let elem of USERS) {
  //     if (elem.email === email) {
  //       elem.blogs.push(id);
  //       fs.writeFileSync("users.json", JSON.stringify(USERS));
  //       break;
  //     }
  //   }

  //   res.status(200).send("Blog published!");
  // } else {
  //   res.status(403).send("Error Occured");
  // }
});

// Get User Dashboard

// app.get("/users/dashboard", authenticateJWT, (req, res) => {

// });

// Get All Blogs

app.get("/users/blogs", authenticateJWT, (req, res) => {
  res.status(200).send(JSON.stringify(BLOGS));
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
