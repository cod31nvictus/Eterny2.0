import prisma from "../db/prisma";
import { extractProfileFromText } from "../openai/client";

// In a full implementation, this prompt would be shared via packages/shared
const PROFILE_EXTRACTION_PROMPT = `
You are a structured data extractor for a personal health profile.
Read the text and return a JSON object with an array \"fields\", where each field has:
  - bucket: one of [\"BasicInfo\",\"MedicalProfile\",\"Constraints\",\"Biomarkers\",\"BodyComposition\",\"PersonalCare\",\"Lifestyle\"]
  - key: string identifier
  - value: JSON value
  - effectiveAt: ISO timestamp string (use the best available date or now)
`;

export async function extract_profile_patch_from_text(
  userId: string,
  text: string,
  sourceMeta: { sourceType: string; sourceId?: string }
) {
  const raw = await extractProfileFromText(PROFILE_EXTRACTION_PROMPT, text);
  const fields = Array.isArray(raw.fields) ? raw.fields : [];
  return fields.map((f: any) => ({
    userId,
    bucket: String(f.bucket),
    key: String(f.key),
    value: f.value,
    effectiveAt: new Date(f.effectiveAt || new Date().toISOString()),
    sourceType: sourceMeta.sourceType,
    sourceId: sourceMeta.sourceId ?? null,
  }));
}

export async function upsert_profile_fields(
  userId: string,
  patch: Awaited<ReturnType<typeof extract_profile_patch_from_text>>
) {
  // For Phase 1 we simply append new rows; latest is selected via effectiveAt.
  if (!patch.length) return;
  await prisma.userProfileField.createMany({
    data: patch,
  });
}

export async function ingest_profile_from_text(
  userId: string,
  text: string,
  sourceMeta: { sourceType: string; sourceId?: string }
) {
  const patch = await extract_profile_patch_from_text(userId, text, sourceMeta);
  await upsert_profile_fields(userId, patch);
  return patch;
}

