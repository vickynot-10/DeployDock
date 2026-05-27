import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";


export async function AskAIController(req: Request, res: Response) {
  try {
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

const data = req.body
console.log(data)

    return res.status(200).json({
      ok : "ok"
    });
  } catch (e) {
    throw e;
  }
}
