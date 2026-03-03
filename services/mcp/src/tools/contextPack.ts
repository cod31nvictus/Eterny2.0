import prisma from "../db/prisma";
import { searchMemory } from "./memory";

export async function build_context_pack(
  userId: string,
  threadId: string,
  newMessageText: string
) {
  const messages = await prisma.chatMessage.findMany({
    where: { threadId, userId },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  // Profile snapshot: latest per bucket+key
  const fields = await prisma.userProfileField.findMany({
    where: { userId },
    orderBy: [{ bucket: "asc" }, { key: "asc" }, { effectiveAt: "desc" }],
  });
  const latestMap = new Map<string, (typeof fields)[number]>();
  for (const f of fields) {
    const key = `${f.bucket}:${f.key}`;
    if (!latestMap.has(key)) latestMap.set(key, f);
  }
  const profileSummary: Record<string, any[]> = {};
  for (const f of latestMap.values()) {
    if (!profileSummary[f.bucket]) profileSummary[f.bucket] = [];
    profileSummary[f.bucket].push({
      key: f.key,
      value: f.value,
      effectiveAt: f.effectiveAt.toISOString(),
    });
  }

  const memoryChunks = await searchMemory(userId, newMessageText, 8);

  return {
    recentMessages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    profileSummary,
    retrievedMemories: memoryChunks,
  };
}

