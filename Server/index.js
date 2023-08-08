// Blog API: Develop a blogging platform's backend where users can create, update, and delete posts. Implement features like user authentication, comments, tags, and the ability to like or bookmark posts.

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const port = 3000;
const app = express();

app.use(express.json());

let USERS = [];
let BLOGS = [];

try {
  USERS = JSON.parse(fs.readFileSync("users.json", "utf8"));
  BLOGS = JSON.parse(fs.readFileSync("blogs.json", "utf8"));
} catch {
  USERS = [];
  BLOGS = [];
}

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

// Users Signup Route

app.post("/signup", (req, res) => {
  const userCreds = req.body;
  let email = userCreds.email;

  let existingUser = false;

  for (let elem of USERS) {
    if (elem.email === userCreds.email) {
      existingUser = true;
      break;
    }
  }

  if (existingUser) {
    res.status(403).send("User already exists! Kindly login.");
  } else {
    const newUser = {
      name: userCreds.name,
      email: userCreds.email,
      password: userCreds.password,
      blogs: [],
    };

    USERS.push(newUser);

    const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
      expiresIn: "1h",
    });

    fs.writeFileSync("users.json", JSON.stringify(USERS));
    res.status(200).json({ message: "User Created successfully!", token });
  }
});

// Login route

app.post("/login", (req, res) => {
  const userCreds = req.body;
  let email = userCreds.email;
  for (let elem of USERS) {
    if (
      elem.email === userCreds.email &&
      elem.password === userCreds.password
    ) {
      const token = jwt.sign({ email, role: "user" }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.status(200).json({ message: "User Logged in Successfully!", token });
    }
  }

  res.status(401).send("Invalid Credentials!");
});

// Route for creating Blog!

app.post("/craft", authenticateJWT, (req, res) => {
  const email = req.headers.email;
  const blogBody = req.body;

  if (blogBody) {
    let id = Math.floor(Math.random() * 100000);
    const newBlog = {
      id: id,
      title: blogBody.title,
      description: blogBody.description,
      imgLink: blogBody.imgLink,
      mainBlog: blogBody.mainBlog,
    };

    BLOGS.push(newBlog);
    fs.writeFileSync("blogs.json", JSON.stringify(BLOGS));

    for (let elem of USERS) {
      if (elem.email === email) {
        elem.blogs.push(id);
        fs.writeFileSync("users.json", JSON.stringify(USERS));
        break;
      }
    }

    res.status(200).send("Blog published!");
  } else {
    res.status(403).send("Error Occured");
  }
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
