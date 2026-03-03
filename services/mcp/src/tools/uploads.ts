import prisma from "../db/prisma";
import { extract_profile_patch_from_text, upsert_profile_fields } from "./profile";
import { storeMemoryFromUploadChunk } from "./memory";

export async function ingest_upload(userId: string, uploadId: string) {
  const startedAt = new Date();

  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, userId },
  });
  if (!upload) {
    throw new Error("Upload not found");
  }

  try {
    const chunks = await prisma.uploadChunk.findMany({
      where: { uploadId, userId },
      orderBy: { chunkIndex: "asc" },
    });

    const fullText = chunks.map((c) => c.text).join("\n\n");

    const profilePatch = await extract_profile_patch_from_text(userId, fullText, {
      sourceType: "upload",
      sourceId: uploadId,
    });

    await upsert_profile_fields(userId, profilePatch);

    // Embed each chunk into MemoryChunk (T49)
    for (const chunk of chunks) {
      try {
        await storeMemoryFromUploadChunk(userId, chunk.id);
      } catch (err) {
        console.error(`Failed to embed chunk ${chunk.id}:`, err);
      }
    }

    await prisma.mcpRun.create({
      data: {
        userId,
        uploadId,
        runType: "upload_ingest",
        status: "completed",
        startedAt,
        endedAt: new Date(),
      },
    });
  } catch (err: any) {
    await prisma.mcpRun.create({
      data: {
        userId,
        uploadId,
        runType: "upload_ingest",
        status: "failed",
        startedAt,
        endedAt: new Date(),
        error: err?.message || String(err),
      },
    });
    throw err;
  }
}
