const MCP_BASE_URL = process.env.MCP_BASE_URL || "http://localhost:4100";

type IngestChatProfileRequest = {
  userId: string;
  text: string;
  threadId?: string;
  messageId?: string;
};

type BuildContextPackRequest = {
  userId: string;
  threadId: string;
  newMessageText: string;
};

type IngestUploadRequest = {
  userId: string;
  uploadId: string;
};

export async function ingestChatProfile(req: IngestChatProfileRequest): Promise<void> {
  const res = await fetch(`${MCP_BASE_URL}/tools/ingest-chat-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MCP ingest-chat-profile failed: ${res.status} ${text}`);
  }
}

export async function buildContextPack(
  req: BuildContextPackRequest
): Promise<any> {
  const res = await fetch(`${MCP_BASE_URL}/tools/build-context-pack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MCP build-context-pack failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function ingestUpload(req: IngestUploadRequest): Promise<void> {
  const res = await fetch(`${MCP_BASE_URL}/tools/ingest-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MCP ingest-upload failed: ${res.status} ${text}`);
  }
}

