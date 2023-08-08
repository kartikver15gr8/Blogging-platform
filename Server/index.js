// Blog API: Develop a blogging platform's backend where users can create, update, and delete posts. Implement features like user authentication, comments, tags, and the ability to like or bookmark posts.

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const port = 3000;
const app = express();

app.use(express.json());

let USERS = [];

try {
  USERS = JSON.parse(fs.readFileSync("users.json", "utf8"));
} catch {
  USERS = [];
}

const SECRET_KEY = "MyBloggingPlatform!";

// Users Signup Route

app.post("/signup", (req, res) => {
  const userCreds = req.body;
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

    fs.writeFileSync("users.json", JSON.stringify(USERS));
    res.status(200).send("User Created successfully!");
  }
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
