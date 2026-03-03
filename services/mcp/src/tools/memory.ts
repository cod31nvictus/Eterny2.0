import { randomUUID } from "crypto";
import prisma from "../db/prisma";
import { embedTexts } from "../openai/client";

export async function storeMemoryFromUploadChunk(
  userId: string,
  uploadChunkId: string
) {
  const chunk = await prisma.uploadChunk.findFirst({
    where: { id: uploadChunkId, userId },
  });
  if (!chunk) return;

  const [embedding] = await embedTexts([chunk.text]);

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "MemoryChunk" (id, "userId", "sourceType", "sourceId", text, embedding, "createdAt")
    VALUES (${id}, ${userId}, 'upload', ${uploadChunkId}, ${chunk.text},
            ${JSON.stringify(embedding)}::vector, NOW())
  `;
}

export async function searchMemory(
  userId: string,
  queryText: string,
  topK: number
) {
  const [embedding] = await embedTexts([queryText]);

  const result = await prisma.$queryRawUnsafe<
    { id: string; text: string }[]
  >(
    `
    SELECT id, text
    FROM "MemoryChunk"
    WHERE "userId" = $1
    ORDER BY embedding <-> $2::vector
    LIMIT $3
  `,
    userId,
    JSON.stringify(embedding),
    topK
  );

  return result;
}
