import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "30m"; // reasonable default
const REFRESH_TOKEN_TTL = "30d";

const accessSecret = process.env.JWT_SECRET || "dev-access-secret";
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret";

export interface AccessTokenPayload {
  userId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, accessSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, refreshSecret, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, refreshSecret) as AccessTokenPayload;
}

