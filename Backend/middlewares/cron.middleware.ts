import { Request, Response, NextFunction } from "express";
import { LogError } from "../helpers/LogErrors";

export function CronAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    LogError("Unauthorized access attempt to cron endpoint");
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}
