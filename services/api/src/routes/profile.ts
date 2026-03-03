import { Router } from "express";
import prisma from "../db/prisma";
import { authenticate, AuthedRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;

    const fields = await prisma.userProfileField.findMany({
      where: { userId },
      orderBy: [{ bucket: "asc" }, { key: "asc" }, { effectiveAt: "desc" }],
    });

    // Collapse to latest per bucket+key
    const latestMap = new Map<string, (typeof fields)[number]>();
    for (const f of fields) {
      const key = `${f.bucket}:${f.key}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, f);
      }
    }

    const grouped: Record<string, { key: string; value: unknown; effectiveAt: string }[]> =
      {};
    for (const f of latestMap.values()) {
      if (!grouped[f.bucket]) grouped[f.bucket] = [];
      grouped[f.bucket].push({
        key: f.key,
        value: f.value,
        effectiveAt: f.effectiveAt.toISOString(),
      });
    }

    return res.json(grouped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

export default router;

