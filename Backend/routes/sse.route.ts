import { Router, Request, Response } from "express";
import { clients } from "../libs/SSE";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/events", (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const client_id = crypto.randomUUID(); 
  clients.set(client_id, { res, user_id: user.user_id });

  req.on("close", () => clients.delete(client_id));
});

export default router;