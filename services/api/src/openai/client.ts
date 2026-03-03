import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set; OpenAI calls will fail until configured.");
}

const chatModel = process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini";
const embeddingModel = process.env.OPENAI_MODEL_EMBEDDING || "text-embedding-3-small";

export const openai = new OpenAI({ apiKey });

export async function generateChatCompletion(messages: { role: "user" | "assistant" | "system"; content: string }[]) {
  const response = await openai.chat.completions.create({
    model: chatModel,
    messages,
  });

  const choice = response.choices[0];
  const content = choice.message.content || "";

  return {
    content,
    model: response.model,
    usage: response.usage,
  };
}

export async function streamChatCompletion(
  messages: { role: "user" | "assistant" | "system"; content: string }[]
) {
  return openai.chat.completions.create({
    model: chatModel,
    messages,
    stream: true,
  });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: embeddingModel,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

