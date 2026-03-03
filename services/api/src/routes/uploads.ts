import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import prisma from "../db/prisma";
import { authenticate, AuthedRequest } from "../middleware/auth";
import { ingestUpload } from "../mcp/client";

type MulterRequest = AuthedRequest & { file?: Express.Multer.File };

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

function chunkText(text: string, wordsPerChunk = 800, overlapWords = 100): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += wordsPerChunk - overlapWords;
  }
  return chunks;
}

// Synchronous text extraction — no DB writes, no MCP trigger
router.post("/parse", upload.single("file"), async (req: MulterRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    let text = "";
    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(file.buffer);
      text = parsed.text.trim();
    } else if (file.mimetype.startsWith("text/")) {
      text = file.buffer.toString("utf-8").trim();
    } else {
      return res.status(400).json({ error: "Unsupported file type. Only PDF and text files are supported." });
    }
    return res.json({ text: text.slice(0, 8000) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to parse file" });
  }
});

router.post("/", upload.single("file"), async (req: MulterRequest, res) => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded. Use multipart/form-data with field name 'file'." });
    }

    const { originalname, mimetype, size, buffer } = file;

    let rawText = "";
    if (mimetype === "application/pdf") {
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
    } else if (mimetype.startsWith("text/")) {
      rawText = buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Only PDF and plain text are supported." });
    }

    const uploadRecord = await prisma.upload.create({
      data: {
        userId,
        filename: originalname,
        mimeType: mimetype,
        sizeBytes: size,
        storageUrl: `local://${originalname}`,
        status: "processing",
      },
    });

    const textChunks = chunkText(rawText);
    if (textChunks.length > 0) {
      await prisma.uploadChunk.createMany({
        data: textChunks.map((text, idx) => ({
          uploadId: uploadRecord.id,
          userId,
          chunkIndex: idx,
          text,
        })),
      });
    }

    await prisma.upload.update({
      where: { id: uploadRecord.id },
      data: { status: "uploaded" },
    });

    // Fire-and-forget MCP ingestion
    ingestUpload({ userId, uploadId: uploadRecord.id }).catch((err) => {
      console.error("MCP ingest-upload failed:", err);
    });

    return res.status(201).json(uploadRecord);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
