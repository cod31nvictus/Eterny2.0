import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ingest_upload } from "./tools/uploads";
import { build_context_pack } from "./tools/contextPack";
import { ingest_profile_from_text } from "./tools/profile";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Simple HTTP wrappers around MCP tools
app.post("/tools/ingest-upload", async (req, res) => {
  try {
    const { userId, uploadId } = req.body as {
      userId?: string;
      uploadId?: string;
    };
    if (!userId || !uploadId) {
      return res.status(400).json({ error: "userId and uploadId are required" });
    }
    await ingest_upload(userId, uploadId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "ingest_upload failed", details: err.message });
  }
});

app.post("/tools/build-context-pack", async (req, res) => {
  try {
    const { userId, threadId, newMessageText } = req.body as {
      userId?: string;
      threadId?: string;
      newMessageText?: string;
    };
    if (!userId || !threadId || !newMessageText) {
      return res
        .status(400)
        .json({ error: "userId, threadId, and newMessageText are required" });
    }
    const pack = await build_context_pack(userId, threadId, newMessageText);
    return res.json(pack);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "build_context_pack failed", details: err.message });
  }
});

app.post("/tools/ingest-chat-profile", async (req, res) => {
  try {
    const { userId, text, threadId, messageId } = req.body as {
      userId?: string;
      text?: string;
      threadId?: string;
      messageId?: string;
    };
    if (!userId || !text) {
      return res.status(400).json({ error: "userId and text are required" });
    }

    const patch = await ingest_profile_from_text(userId, text, {
      sourceType: "chat",
      sourceId: messageId || threadId,
    });

    return res.json({
      count: patch.length,
      fields: patch.map((f: any) => ({
        bucket: f.bucket,
        key: f.key,
        effectiveAt: f.effectiveAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "ingest_chat_profile failed", details: err.message });
  }
});

const PORT = process.env.MCP_PORT || 4100;

app.listen(PORT, () => {
  console.log(`MCP service listening on port ${PORT}`);
});


