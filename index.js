require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send("All fields are required.");
  }

  const checkEmailQuery = "SELECT COUNT(*) AS count FROM users WHERE email = ?";
  db.execute(checkEmailQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      return res.status(500).send("Server error.");
    }

    const count = results[0].count;
    if (count > 0) {
      return res.status(400).send("Email already exists.");
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
      db.execute(insertQuery, [name, email, hashedPassword], (err, results) => {
        if (err) {
          console.error("Error inserting into the database:", err);
          return res.status(500).send("Server error.");
        }
        res.status(201).send("User created successfully.");
      });
    } catch (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Server error.");
    }
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const loginQuery = "SELECT * FROM users WHERE email = ?";
  db.execute(loginQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      return res.status(500).send("Server error.");
    }

    if (results.length === 0) {
      return res.status(401).send("Invalid email or password.");
    }

    const user = results[0];

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).send("Invalid email or password.");
      }

      res.status(200).json({ success: true, username: user.name });
    } catch (err) {
      console.error("Error comparing passwords:", err);
      return res.status(500).send("Server error.");
    }
  });
});

app.post("/logout", (req, res) => {
  res.status(200).send("Logout successful.");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
