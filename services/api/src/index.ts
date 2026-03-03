import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import uploadsRoutes from "./routes/uploads";
import profileRoutes from "./routes/profile";

// Load .env from services/api so OPENAI_API_KEY is set even when run from monorepo root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/uploads", uploadsRoutes);
app.use("/profile", profileRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});


