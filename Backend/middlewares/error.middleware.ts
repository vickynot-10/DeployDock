import { Request, Response, NextFunction } from "express";
import { LogError } from "../helpers/LogErrors";

export function ErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  LogError(error);

  console.error(error);
  return res.status(500).json({
    success: false,
    msg: "Internal Server Error",
  });
}
