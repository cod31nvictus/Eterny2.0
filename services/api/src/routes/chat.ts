import { Router } from "express";
import prisma from "../db/prisma";
import { authenticate, AuthedRequest } from "../middleware/auth";
import { generateChatCompletion, streamChatCompletion, openai } from "../openai/client";
import { ingestChatProfile, buildContextPack } from "../mcp/client";

const router = Router();

router.use(authenticate);

const SYSTEM_PROMPT = `You are Eterny, a personal health and wellness assistant embedded in the Eterny app.

Important facts about how you work:
- Everything the user shares in this conversation is automatically captured and stored in their health profile by the system. You never need to tell them to use another app or service to save their data.
- When a user mentions health metrics (weight, blood pressure, sleep, medications, mood, symptoms, etc.), acknowledge that you've noted it and it will be remembered.
- The profile snapshot and memories already provided to you below were automatically saved from previous conversations — you can reference them freely.
- Never say you cannot store, save, or remember data. The system handles this automatically.
- Be warm, proactive, and concise. Focus on the user's health and wellness goals.`;

async function autoRenameThread(threadId: string, firstUserMessage: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate a short conversation title (max 5 words) summarising this message. Return only the title, no quotes or punctuation.",
        },
        { role: "user", content: firstUserMessage },
      ],
      max_tokens: 20,
    });
    const newTitle = completion.choices[0].message.content?.trim();
    if (newTitle) {
      await prisma.chatThread.update({ where: { id: threadId }, data: { title: newTitle } });
    }
  } catch (err) {
    console.error("autoRenameThread failed:", err);
  }
}

function buildSystemContent(pack: any): string {
  const parts: string[] = [SYSTEM_PROMPT];
  if (pack?.profileSummary) {
    parts.push("Profile summary (JSON):", JSON.stringify(pack.profileSummary));
  }
  if (Array.isArray(pack?.retrievedMemories) && pack.retrievedMemories.length) {
    parts.push(
      "Relevant memories:",
      pack.retrievedMemories.map((m: any) => `- ${m.text ?? m.snippet ?? ""}`).join("\n")
    );
  }
  return parts.join("\n\n");
}

function applyVisionToLastUserMessage(
  messages: { role: "user" | "assistant" | "system"; content: any }[],
  imageBase64: string,
  imageMimeType: string,
  textContent: string
) {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx !== -1) {
    messages[lastUserIdx] = {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } },
        { type: "text", text: textContent },
      ],
    };
  }
}

// Create thread + greeting
router.post("/threads", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { title } = req.body as { title?: string };
    const thread = await prisma.chatThread.create({
      data: { userId, title: title || "New conversation" },
    });

    // Look up user's name for a personalised greeting
    const nameField = await prisma.userProfileField.findFirst({
      where: { userId, bucket: "BasicInfo", key: "name" },
      orderBy: { effectiveAt: "desc" },
    });
    const rawName = nameField?.value;
    const displayName = typeof rawName === "string" && rawName ? rawName : null;
    const greeting = displayName
      ? `Hi ${displayName}! I'm Eterny, your personal wellness assistant. What would you like to talk about today?`
      : `Hi! I'm Eterny, your personal wellness assistant. What would you like to talk about today?`;

    await prisma.chatMessage.create({
      data: { threadId: thread.id, userId, role: "assistant", content: greeting },
    });

    return res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create thread" });
  }
});

// List threads
router.get("/threads", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const threads = await prisma.chatThread.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(threads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to list threads" });
  }
});

// Get single thread
router.get("/threads/:id", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    return res.json(thread);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get thread" });
  }
});

// Rename thread
router.patch("/threads/:id", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title } = req.body as { title?: string };
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    const updated = await prisma.chatThread.update({
      where: { id },
      data: { title: title.trim() },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to rename thread" });
  }
});

// Delete thread
router.delete("/threads/:id", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    await prisma.chatMessage.deleteMany({ where: { threadId: id } });
    await prisma.chatThread.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete thread" });
  }
});

// List messages
router.get("/threads/:id/messages", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    const messages = await prisma.chatMessage.findMany({
      where: { threadId: id },
      orderBy: { createdAt: "asc" },
    });
    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to list messages" });
  }
});

// Create user message
router.post("/threads/:id/messages", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content, imageBase64, imageMimeType } = req.body as {
      content?: string;
      imageBase64?: string;
      imageMimeType?: string;
    };
    if (!content) return res.status(400).json({ error: "Content is required" });

    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    const metadata: Record<string, any> = {};
    if (imageBase64) metadata.imageBase64 = imageBase64;
    if (imageMimeType) metadata.imageMimeType = imageMimeType;

    const message = await prisma.chatMessage.create({
      data: {
        threadId: id,
        userId,
        role: "user",
        content,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    });

    await prisma.chatThread.update({ where: { id }, data: { updatedAt: message.createdAt } });

    // Auto-rename: fire-and-forget when this is the first user message on a default-titled thread
    if (thread.title === "New conversation") {
      const userMsgCount = await prisma.chatMessage.count({ where: { threadId: id, role: "user" } });
      if (userMsgCount === 1) {
        autoRenameThread(id, content).catch(() => {});
      }
    }

    // Best-effort profile ingestion
    ingestChatProfile({ userId, text: content, threadId: id, messageId: message.id }).catch((err) => {
      console.error("MCP ingest-chat-profile failed:", err);
    });

    return res.status(201).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create message" });
  }
});

// Assistant reply (non-stream)
router.post("/threads/:id/assistant", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    const lastUserMessage = await prisma.chatMessage.findFirst({
      where: { threadId: id, userId, role: "user" },
      orderBy: { createdAt: "desc" },
    });

    let openAiMessages: { role: "user" | "assistant" | "system"; content: any }[] | undefined;

    if (lastUserMessage) {
      try {
        const pack = await buildContextPack({
          userId,
          threadId: id,
          newMessageText: lastUserMessage.content,
        });

        openAiMessages = [
          { role: "system", content: buildSystemContent(pack) },
          ...(Array.isArray(pack.recentMessages)
            ? pack.recentMessages.map(
                (m: any): { role: "user" | "assistant" | "system"; content: any } => ({
                  role: (m.role as "user" | "assistant" | "system") || "user",
                  content: String(m.content ?? ""),
                })
              )
            : []),
        ];
      } catch (err) {
        console.error("MCP build-context-pack failed, falling back to raw history:", err);
      }
    }

    if (!openAiMessages) {
      const messages = await prisma.chatMessage.findMany({
        where: { threadId: id },
        orderBy: { createdAt: "asc" },
        take: 30,
      });
      openAiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];
    }

    // Apply vision if last user message has an image
    const meta = lastUserMessage?.metadata as Record<string, any> | null;
    if (meta?.imageBase64 && meta?.imageMimeType) {
      applyVisionToLastUserMessage(openAiMessages, meta.imageBase64, meta.imageMimeType, lastUserMessage!.content);
    }

    const result = await generateChatCompletion(openAiMessages as any);

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        threadId: id,
        userId,
        role: "assistant",
        content: result.content,
        metadata: { model: result.model, usage: result.usage as any },
      },
    });

    await prisma.chatThread.update({ where: { id }, data: { updatedAt: assistantMessage.createdAt } });

    if (result.usage) {
      const { prompt_tokens, completion_tokens, total_tokens } = result.usage as any;
      await prisma.aiUsageLog.create({
        data: {
          userId,
          provider: "openai",
          model: result.model,
          tokensIn: prompt_tokens ?? 0,
          tokensOut: completion_tokens ?? total_tokens ?? 0,
          sourceType: "chat",
          sourceId: id,
        },
      });
    }

    return res.json(assistantMessage);
  } catch (err: any) {
    console.error("Assistant reply failed:", err);
    const message = err?.message || err?.error?.message || "Assistant reply failed";
    return res.status(500).json({ error: "Assistant reply failed", details: message });
  }
});

// Streaming assistant reply (SSE)
router.post("/threads/:id/stream", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const thread = await prisma.chatThread.findFirst({ where: { id, userId } });
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    const lastUserMessage = await prisma.chatMessage.findFirst({
      where: { threadId: id, userId, role: "user" },
      orderBy: { createdAt: "desc" },
    });

    let openAiMessages: { role: "user" | "assistant" | "system"; content: any }[] | undefined;

    if (lastUserMessage) {
      try {
        const pack = await buildContextPack({
          userId,
          threadId: id,
          newMessageText: lastUserMessage.content,
        });
        openAiMessages = [
          { role: "system", content: buildSystemContent(pack) },
          ...(Array.isArray(pack.recentMessages)
            ? pack.recentMessages.map(
                (m: any): { role: "user" | "assistant" | "system"; content: any } => ({
                  role: (m.role as "user" | "assistant" | "system") || "user",
                  content: String(m.content ?? ""),
                })
              )
            : []),
        ];
      } catch (err) {
        console.error("MCP build-context-pack failed for stream, using fallback:", err);
      }
    }

    if (!openAiMessages) {
      const messages = await prisma.chatMessage.findMany({
        where: { threadId: id },
        orderBy: { createdAt: "asc" },
        take: 30,
      });
      openAiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ];
    }

    // Apply vision if last user message has an image
    const meta = lastUserMessage?.metadata as Record<string, any> | null;
    if (meta?.imageBase64 && meta?.imageMimeType) {
      applyVisionToLastUserMessage(openAiMessages, meta.imageBase64, meta.imageMimeType, lastUserMessage!.content);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await streamChatCompletion(openAiMessages as any);
    let fullContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    const assistantMessage = await prisma.chatMessage.create({
      data: { threadId: id, userId, role: "assistant", content: fullContent },
    });

    await prisma.chatThread.update({ where: { id }, data: { updatedAt: assistantMessage.createdAt } });
  } catch (err: any) {
    console.error("Stream assistant reply failed:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Stream failed", details: err?.message });
    }
    res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    res.end();
  }
});

export default router;
