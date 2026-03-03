import { Router } from "express";
import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "../services/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/jwt";
import crypto from "crypto";

const router = Router();

// Helpers
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sendTokens(res: any, userId: string) {
  const accessToken = signAccessToken({ userId });
  const refreshToken = signRefreshToken({ userId });

  // Store hashed refresh token
  const tokenHash = hashToken(refreshToken);
  prisma.refreshToken
    .create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    .catch((e) => console.error('RefreshToken write failed:', e));

  res.json({ accessToken, refreshToken });
}

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { phone, password } = req.body as {
      phone?: string;
      password?: string;
    };
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: "Phone already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { phone, passwordHash },
    });

    return sendTokens(res, user.id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body as {
      phone?: string;
      password?: string;
    };
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return sendTokens(res, user.id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findFirst({
      where: { userId: payload.userId, tokenHash, revokedAt: null },
    });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Issue new access token
    const accessToken = signAccessToken({ userId: payload.userId });
    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.json({ success: true });
    }
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { userId: payload.userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

// OTP stubs
router.post("/otp/request", async (req, res) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.otpCode.create({ data: { phone, code, expiresAt } });
    const responseBody: Record<string, unknown> = { sent: true };
    if (process.env.NODE_ENV !== 'production') {
      responseBody.code = code;
    }
    return res.json(responseBody);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OTP request failed" });
  }
});

router.post("/otp/verify", async (req, res) => {
  try {
    const { phone, code } = req.body as { phone?: string; code?: string };
    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and code are required" });
    }
    const record = await prisma.otpCode.findFirst({
      where: { phone, code },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.expiresAt < new Date() || record.consumedAt) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark consumed
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    // Ensure user exists
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    return sendTokens(res, user.id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
});

// Social stubs
router.all("/google", (_req, res) => {
  return res.status(501).json({ error: "Google login not implemented in Phase 1" });
});

router.all("/apple", (_req, res) => {
  return res.status(501).json({ error: "Apple login not implemented in Phase 1" });
});

router.all("/microsoft", (_req, res) => {
  return res.status(501).json({ error: "Microsoft login not implemented in Phase 1" });
});

export default router;

