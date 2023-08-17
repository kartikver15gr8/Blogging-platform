"use strict";
// Blog API: Develop a blogging platform's backend where users can create, update, and delete posts. Implement features like user authentication, comments, tags, and the ability to like or bookmark posts.
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
// const fs = require("fs");
const port = 3000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Defining Mongoose Schemas
const adminSchema = new mongoose_1.default.Schema({
  name: String,
  email: String,
  password: String,
});
const userSchema = new mongoose_1.default.Schema({
  name: String,
  email: String,
  password: String,
  blogs: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Blogs" }],
});
const blogSchema = new mongoose_1.default.Schema({
  title: String,
  description: String,
  imgLink: String,
  mainBlog: String,
});
// Defining Mongoose Models
const Admins = mongoose_1.default.model("Admins", adminSchema);
const Users = mongoose_1.default.model("Users", userSchema);
const Blogs = mongoose_1.default.model("Blogs", blogSchema);
// For Users Authentication
const SECRET_KEY = "MyBloggingPlatform!";
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jsonwebtoken_1.default.verify(token, SECRET_KEY, (err, payload) => {
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
const authenticateAdmins = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jsonwebtoken_1.default.verify(token, SECRET_FOR_ADMIN, (err, payload) => {
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
mongoose_1.default.connect(
  "mongodb+srv://Kartik:M6I1SRXOHJRS3DhA@cluster0.vioh21c.mongodb.net/BlogApp",
  { dbName: "BlogApp" }
);
// mongoose.connect("mongodb://localhost:27017");
// Admins Signup
app.post("/admin/signup", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const userCreds = req.body;
    const name = userCreds.name;
    const email = userCreds.email;
    const password = userCreds.password;
    // let existingUser = false;
    const admin = yield Admins.findOne({ email });
    if (admin) {
      res.status(403).json({ message: "Admin already exists" });
    } else {
      const obj = { name: name, email: email, password: password };
      const newAdmin = new Admins(obj);
      newAdmin.save();
      const token = jsonwebtoken_1.default.sign(
        { email, role: "admin" },
        SECRET_FOR_ADMIN,
        {
          expiresIn: "1h",
        }
      );
      res
        .status(200)
        .json({ message: "Admin has been created successfully!", token });
    }
  })
);
// Admins Login
app.post("/admin/login", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const userCreds = req.body;
    const email = userCreds.email;
    const password = userCreds.password;
    const admin = yield Admins.findOne({ email, password });
    if (admin) {
      const token = jsonwebtoken_1.default.sign(
        { email, role: "admin" },
        SECRET_FOR_ADMIN,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({ message: "Admin logged in Successfully", token });
    } else {
      res.status(403).json({ message: "Invalid username or password" });
    }
  })
);
// Get All Users
app.get("/admin/allusers", authenticateAdmins, (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const users = yield Users.find({});
    res.status(200).send(users);
  })
);
// ---------------- Below are Users Routes ----------------------
// Users Signup Route
app.post("/users/signup", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    const user = yield Users.findOne({ email });
    if (user) {
      res.status(403).send("User already exists!");
    } else {
      const obj = { name: name, email: email, password: password, blogs: [] };
      const newUser = new Users(obj);
      newUser.save();
      const token = jsonwebtoken_1.default.sign(
        { email, role: "user" },
        SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
      res
        .status(200)
        .json({ message: "User has been created successfully!", token });
    }
  })
);
// Login route
app.post("/users/login", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const userCreds = req.body;
    let email = userCreds.email;
    let password = userCreds.password;
    const user = yield Users.findOne({ email, password });
    if (user) {
      const token = jsonwebtoken_1.default.sign(
        { email, role: "user" },
        SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({ message: "User logged in successfully!", token });
    } else {
      res.status(403).send("Invalid Creds!");
    }
  })
);
// Route for creating Blog!
app.post("/users/craft", authenticateJWT, (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const email = req.headers["user"];
    const user = yield Users.findOne({ email: email });
    if (user) {
      const blog = new Blogs(req.body);
      yield blog.save();
      user.blogs.push(blog._id);
      yield user.save();
      res.status(200).json({ message: "Blog published successfully!" });
    } else {
      res.status(401).send("Failed");
    }
  })
);
// Get All Blogs
app.get("/users/blogs", authenticateJWT, (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const blogs = yield Blogs.find({});
    res.status(200).send(blogs);
  })
);
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
