import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { isMongoError } from "../helpers/isMongoError";
import { generateToken } from "../libs/jwt";
const updateUserProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .trim(),

  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export async function UpdateUserProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({
        msg: "UnAuthorized",
      });
    }
    const user_id = new ObjectId(user.user_id);

    const parsed = updateUserProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = {
      name: parsed.data.full_name,
      email: parsed.data.email,
      updated_on: new Date(),
      updated_by: user_id,
    };

    const db = await getDb();

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;

    const tenantdb = await getDb(tenant_key);

    const [update_user, update_user2] = await Promise.all([
      db.collection("users").updateOne(
        { _id: user_id },
        {
          $set: {
            ...payload,
          },
        },
      ),
      tenantdb.collection("users").updateOne(
        { _id: user_id },
        {
          $set: {
            ...payload,
          },
        },
      ),
    ]);

    if (update_user.matchedCount === 0) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    if (update_user.modifiedCount === 0) {
      return res.status(200).json({
        msg: "No changes made",
      });
    }

    const updatedUserPayload = {
      user_id: user.user_id,
      name: parsed.data.full_name,
      email: parsed.data.email,
      provider: user.provider,
      tenant_id: user.tenant_id,
    };

    const token = generateToken(updatedUserPayload);

    res.cookie("deploy_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      msg: "Profile Updated Successfully",
      isUpdate: true,
    });
  } catch (e) {
    if (isMongoError(e, 11000)) {
      return res.status(400).json({ msg: "User with Mail already exists" });
    }
    throw e
  }
}
