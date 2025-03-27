import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ipoRoutes from "./ipoRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use IPO routes
app.use("/api", ipoRoutes);

// Define PORT
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
