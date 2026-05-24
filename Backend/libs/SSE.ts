
import { Response } from "express";

interface SSEClient {
  res: Response;
  user_id: string;
}

export const clients = new Map<string, SSEClient>();

export function broadcast(user_id: string, data: object) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.user_id === user_id) {
      client.res.write(msg);
    }
  }
}