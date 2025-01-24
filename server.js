const express = require("express");
const { use } = require("passport");
const app = express();
const port = process.env.PORT || 3000;
const SECRET_JWT_KEY = 'tisosalmeniaebali228';
const jwt = require("jsonwebtoken");
app.use(express.json()); // for parsing application/json
// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here

let users = [];
const highScores = {};

const validatePassword = (req, res, next) => {
  console.log("Request Body:", req.body);
  if (!req.body || typeof req.body.userHandle !== "string" || typeof req.body.password !== "string") {
    res.status(400).send("Invalid request body");
    return;
  }

  if (req.body.userHandle.length < 6 || req.body.password.length < 6) {
    res.status(400).send("Invalid request body");
    return;
  }

  req.user = {
    userHandle: req.body.userHandle,
    password: req.body.password
  };

  next();
};


app.post("/signup", validatePassword, (req, res) => {
  users.push(req.user);
  res.status(201).send("User registered successfully");
});


app.post("/login", (req, res) => {
  if (
    !req.body || 
    typeof req.body.userHandle !== "string" || 
    typeof req.body.password !== "string" || 
    req.body.userHandle.trim().length === 0 || 
    req.body.password.trim().length === 0  || 
    Object.keys(req.body).length > 2   
  ) {
    res.status(400).send("Bad Request: userHandle or password is missing or empty");
    return;
  }

  
  const user = users.find(
    (u) => u.userHandle === req.body.userHandle && u.password === req.body.password
  );


  if (!user) {
    res.status(401).send("Unauthorized, incorrect username or password");
    return;
  }

  
  const token = jwt.sign(
    { userHandle: user.userHandle }, 
    SECRET_JWT_KEY, 
    { expiresIn: "1h" } 
  );
  console.log("Generated token:", token);
   res.status(200).json({ jsonWebToken: token });
});


app.post("/high-scores", (req, res) => {
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Does not start with Bearer")
    res.status(401).send("Unauthorized, JWT token is missing or invalid");
    return;
  }

  const token = authHeader.split(" ")[1]; 
  console.log(token)
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_JWT_KEY);
    console.log("Headers:", req.headers.authorization); 
console.log("Decoded token:", decoded);
  } catch (error) {
    res.status(401).send("Unauthorized, invalid JWT token");
    return;
  }


  const { level, userHandle, score, timestamp } = req.body;
  if (
    typeof level !== "string" ||
    typeof userHandle !== "string" ||
    typeof score !== "number" ||
    typeof timestamp !== "string" ||
    new Date(timestamp).toString() === "Invalid Date" 
  ) {
    res.status(400).send("Invalid request body");
    return;
  }

  
  if (decoded.userHandle !== userHandle) {
    res.status(401).send("Unauthorized, userHandle does not match JWT token");
    return;
  }
  if (!highScores[level]) {
    highScores[level] = [];
  }

  highScores[level].push({ userHandle, score, timestamp });

  res.status(201).send("High score submitted successfully");
});

app.get("/high-scores", (req, res) => {
  const level = req.query.level;
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 20; 

  if (!level) {
    res.status(400).send("Bad Request: level is required");
    return;
  }

  const scores = highScores[level] || [];


  if (scores.length === 0) {
    res.status(200).json([]);
    return;
  }


  const scoresWithLevel = scores.map((score) => ({ ...score, level }));


  scoresWithLevel.sort((a, b) => b.score - a.score);


  const startIndex = (page - 1) * pageSize;
  const paginatedScores = scoresWithLevel.slice(startIndex, startIndex + pageSize);

  res.status(200).json(paginatedScores);
});



//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
