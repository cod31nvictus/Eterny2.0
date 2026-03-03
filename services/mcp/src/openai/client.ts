import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set for MCP; OpenAI calls will fail until configured.");
}

const chatModel = process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini";
const embeddingModel = process.env.OPENAI_MODEL_EMBEDDING || "text-embedding-3-small";

export const openai = new OpenAI({ apiKey });

export async function extractProfileFromText(prompt: string, text: string) {
  const response = await openai.chat.completions.create({
    model: chatModel,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: embeddingModel,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

