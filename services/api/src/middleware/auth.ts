import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function authenticate(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing access token" });
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

