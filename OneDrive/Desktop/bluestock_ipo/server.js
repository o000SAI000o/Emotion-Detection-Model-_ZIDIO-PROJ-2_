import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ipoRoutes from "./ipoRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: '*', // Allow requests from any origin
}));

app.use(express.json());

const PORT = process.env.PORT || 8080;

// Use cookie-parser middleware
app.use(cookieParser());

// Use IPO routes
app.use("/api", ipoRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Create a New User
app.post("/users", async (req, res) => {
  try {
      const { name, email } = req.body;
      const result = await pool.query(
          "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
          [name, email]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
  }
});
