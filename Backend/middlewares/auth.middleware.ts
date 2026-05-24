import { Request, Response, NextFunction } from "express";
import { decryptToken } from "../libs/jwt";

export function AuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.deploy_auth;

    if (!token) {
      return res.status(401).json({ msg: "Unauthorized" });
    }
    const decoded = decryptToken(token);
    if (!decoded) {
      return res.status(401).json({ msg: "Unauthorized" });
    }
    (req as any).user = decoded;

    next();
  } catch (e) {
    throw e
  }
}
