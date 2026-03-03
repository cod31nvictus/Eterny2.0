import { z } from "zod";

export const ProfileBucketEnum = z.enum([
  "BasicInfo",
  "MedicalProfile",
  "Constraints",
  "Biomarkers",
  "BodyComposition",
  "PersonalCare",
  "Lifestyle",
]);

export const ProfileFieldSchema = z.object({
  bucket: ProfileBucketEnum,
  key: z.string().min(1),
  value: z.unknown(),
  effectiveAt: z.string().datetime(),
});

export const ProfilePatchSchema = z.object({ fields: z.array(ProfileFieldSchema) });

export type ProfilePatch = z.infer<typeof ProfilePatchSchema>;
export type ProfileField = z.infer<typeof ProfileFieldSchema>;
