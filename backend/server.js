// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
// const connectDB = require("./config/db");

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const insightsRoutes = require("./routes/insightsRoutes");

// const app = express();
// connectDB();

// app.use(cors());
// app.use(express.json());
// app.use(morgan("dev"));

// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

// // Use routes properly
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/insights", insightsRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const insightsRoutes = require("./routes/insightsRoutes");

const app = express();
connectDB();

// Update CORS configuration to allow credentials
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // Add cookie parser
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/insights", insightsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));