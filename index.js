require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
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
  db.execute(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      return res.status(500).send("Server error.");
    }

    const count = results[0].count;
    if (count > 0) {
      return res.status(400).send("Email already exists.");
    }

    const insertQuery =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.execute(insertQuery, [name, email, password], (err, results) => {
      if (err) {
        console.error("Error inserting into the database:", err);
        return res.status(500).send("Server error.");
      }
      res.status(201).send("User created successfully.");
    });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const loginQuery = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.execute(loginQuery, [email, password], (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      return res.status(500).send("Server error.");
    }

    if (results.length === 0) {
      return res.status(401).send("Invalid email or password.");
    }

    res.status(200).json({ success: true, username: results[0].name });
  });
});

app.post("/logout", (req, res) => {
  res.status(200).send("Logout successful.");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
