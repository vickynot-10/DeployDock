import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getDb } from "../libs/mongodb";
import { z } from "zod";
import { encrypt, decrypt } from "../helpers/Encryption";
const ServerSchema = z.object({
  name: z.string().min(1, "Name is required"),

  ssh_host: z.string().min(1, "SSH host is required"),

  ssh_user: z.string().min(1, "SSH user is required"),

  ssh_key: z.string().min(1, "SSH key is required"),

  id: z.string().optional(),
});

function encrypt_server_fields(data: z.infer<typeof ServerSchema>) {
  return {
    ...data,
    ssh_host: encrypt(data.ssh_host),
    ssh_user: encrypt(data.ssh_user),
    ssh_key: encrypt(data.ssh_key),
  };
}

export async function CreateServer(req: Request, res: Response) {
  try {
    const parsed = ServerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        msg: parsed.error.issues[0].message,
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const user_id = (req as any).user.user_id;
    const db = await getDb(tenant_key);

    const encrypted: any = encrypt_server_fields(parsed.data);

    const id = (req.body as any).id;

    if (id && ObjectId.isValid(id)) {

      if (parsed.data.ssh_key.startsWith("***")) {
        delete encrypted.ssh_key;
      }

      
      if (parsed.data.ssh_host.startsWith("***")) {
        delete encrypted.ssh_host;
      }
      
      if (parsed.data.ssh_user.startsWith("***")) {
        delete encrypted.ssh_user;
      }

      const update = await db.collection("servers").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...encrypted,
            updated_on: new Date(),
          },
        },
      );

      if (update.matchedCount === 0) {
        return res.status(404).json({ msg: "Server not found" });
      }

      return res.status(200).json({
        msg: "Server updated successfully",
        is_updated: true,
      });
    }

    const insert = await db.collection("servers").insertOne({
      ...encrypted,
      created_by: new ObjectId(user_id),
      created_on: new Date(),
      updated_on: new Date(),
      status: true,
    });

    if (!insert.acknowledged) {
      return res.status(400).json({ msg: "Failed to save server" });
    }

    return res.status(200).json({
      msg: "Server added successfully",
      is_created: true,
    });
  } catch (e) {
    throw e
  }
}

export async function GetServerById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid ID" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const server = await db.collection("servers").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          created_on: 0,
          updated_on: 0,
          created_by: 0,
          status: 0,
        },
      },
    );

    if (!server) {
      return res.status(404).json({ msg: "Server not found" });
    }

    const safe: any = { ...server };

      safe.ssh_host = decrypt(safe.ssh_host);
      safe.ssh_user = decrypt(safe.ssh_user);
      const real_key = decrypt(safe.ssh_key);

      const visibleChars = 5;
      const maskedLength = Math.max(0, real_key.length - visibleChars);

      safe.ssh_key = "*".repeat(maskedLength) + real_key.slice(-visibleChars);

    return res.status(200).json({ data: safe });
  } catch (e){
    throw e
  }
}

export async function GetServersPagination(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const matchStage: any = {};

    if (search && search.trim() !== "") {
      matchStage.name = {
        $regex: search,
        $options: "i",
      };
    }
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const data = await db
      .collection("servers")
      .find(matchStage, {
        projection: {
          name: 1,
          updated_on: 1,
          status: 1,
        },
      })
      .sort({ updated_on: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    if (!data || data.length === 0) {
      return res.status(200).json({ data: [], total: 0 });
    }

    const total = await db.collection("servers").countDocuments(matchStage);

    return res.status(200).json({ data, total });
  } catch (e) {
    throw e
  }
}

export async function DeleteServer(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid ID" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const in_use = await db.collection("projects").findOne({
      fk_server_id: new ObjectId(id),
      dels: 0,
    });

    if (in_use) {
      return res.status(400).json({
        msg: "Server is in use by one or more projects. Remove it from projects first.",
      });
    }

    const result = await db
      .collection("servers")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Server not found" });
    }

    return res.status(200).json({
      msg: "Server deleted successfully",
      is_deleted: true,
    });
  } catch (e) {
    throw e
  }
}

export async function BulkDeleteServers(req: Request, res: Response) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const objectIds = ids
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ msg: "No valid IDs provided" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const in_use = await db.collection("projects").findOne({
      fk_server_id: { $in: objectIds },
      dels: 0,
    });

    if (in_use) {
      return res.status(400).json({
        msg: "One or more servers are in use by active projects.",
      });
    }

    const result = await db
      .collection("servers")
      .deleteMany({ _id: { $in: objectIds } });

    if (result.deletedCount === 0) {
      return res.status(400).json({ msg: "Failed to delete" });
    }

    return res.status(200).json({
      msg: `${result.deletedCount} server${result.deletedCount > 1 ? "s" : ""} deleted successfully`,
    });
  } catch (e) {
    throw e
  }
}

export async function StatusServerChange(req: Request, res: Response) {
  try {
    const { id, status } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        msg: "Invalid Data",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const update_doc = await db.collection("servers").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          status: status,
          updated_on: new Date(),
        },
      },
    );

    if (update_doc.matchedCount === 0) {
      return res.status(400).json({
        msg: "Server Not Found",
      });
    }

    if (update_doc.modifiedCount === 0) {
      return res.status(400).json({
        msg: "Failed to Change , Please Try Again !",
      });
    }

    return res.status(200).json({
      msg: `Status ${status === true ? "Enabled" : "Disabled"} Successfully !`,
      is_enabled: true,
    });
  } catch (e) {
    throw e
  }
}
export async function ServersList(req: Request, res: Response) {
  try {
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const result = await db
      .collection("servers")
      .find(
        {
          status: true,
        },
        {
          projection: {
            server_type: 1,
            name: 1,
            _id: 1,
          },
        },
      )
      .toArray();

    return res.status(200).json({
      data: result || [],
    });
  } catch (e) {
    throw e
  }
}
