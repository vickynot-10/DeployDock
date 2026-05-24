import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "../helpers/Encryption";
import z from "zod";
import { APP_CONSTANTS } from "../app.constants";
const smtp_schema = z.object({
  email_provider: z.literal("smtp"),
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.string().min(1, "SMTP port is required"),
  smtp_user: z.string().min(1, "SMTP user is required"),
  smtp_password: z.string().min(1, "SMTP password is required"),
  smtp_from: z.string().email("Invalid from address"),
});

const zepto_schema = z.object({
  email_provider: z.literal("zeptomail"),
  zepto_url: z.string().min(1, "ZeptoMail URL is required"),
  zepto_api_key: z.string().min(1, "ZeptoMail API key is required"),
  zepto_from: z.string().email("Invalid from address"),
});

const email_integration_schema = z.discriminatedUnion("email_provider", [
  smtp_schema,
  zepto_schema,
]);

const twilio_schema = z.object({
  whatsapp_provider: z.literal("twilio"),
  twilio_account_sid: z.string().min(1, "Account SID is required"),
  twilio_auth_token: z.string().min(1, "Auth token is required"),
  twilio_from_number: z.string().min(1, "From number is required"),
});

const meta_schema = z.object({
  whatsapp_provider: z.literal("meta"),
  meta_access_token: z.string().min(1, "Access token is required"),
  meta_phone_number_id: z.string().min(1, "Phone number ID is required"),
  meta_business_account_id: z
    .string()
    .min(1, "Business account ID is required"),
});

const whatsapp_integration_schema = z.discriminatedUnion("whatsapp_provider", [
  twilio_schema,
  meta_schema,
]);

export async function UpdateMailIntegration(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({ msg: "UnAuthorized" });
    }

    const user_id = new ObjectId(user.user_id);

    const parsed = email_integration_schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ msg: parsed.error.issues[0].message });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;

    const db = await getDb(tenant_key);
    const data = parsed.data;

    if (data.email_provider === "smtp") {
      await db.collection("integrations").updateOne(
        { type: "mail" },
        {
          $set: {
            type: "mail",
            provider: APP_CONSTANTS.INTEGRATIONS_EMAIL.SMTP,
            smtp_host: data.smtp_host,
            smtp_port: data.smtp_port,
            smtp_user: data.smtp_user,
            smtp_password: encrypt(data.smtp_password),
            smtp_from: data.smtp_from,
            updated_by: user_id,
            updated_on: new Date(),
          },
        },
        { upsert: true },
      );
    } else {
      await db.collection("integrations").updateOne(
        { type: "mail" },
        {
          $set: {
            type: "mail",
            provider: APP_CONSTANTS.INTEGRATIONS_EMAIL.ZEPTO_MAIL,
            zepto_url: data.zepto_url,
            zepto_api_key: encrypt(data.zepto_api_key),
            zepto_from: data.zepto_from,
            updated_by: user_id,
            updated_on: new Date(),
          },
        },
        { upsert: true },
      );
    }

    return res.status(200).json({ success: true, msg: "Email settings saved" });
  } catch (e) {
    throw e
  }
}

export async function GetMailDetails(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({ msg: "UnAuthorized" });
    }
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);
    const doc = await db
      .collection("integrations")
      .aggregate([
        {
          $match: {
            type: "mail",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "updated_by",
            foreignField: "_id",
            as: "user_result",
          },
        },
        {
          $unwind: {
            path: "$user_result",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            provider: 1,
            smtp_user: 1,
            zepto_url: 1,
            zepto_api_key: 1,
            zepto_from: 1,
            updated_on: 1,
            smtp_host: 1,
            smtp_port: 1,
            smtp_password: 1,
            smtp_from: 1,
            updated_by: "$user_result.name",
            automation_provider: 1,
          },
        },
      ])
      .toArray();

    if (!doc || doc.length === 0) {
      return res.status(200).json({ data: null });
    }

    const result = doc[0];

    if (result.smtp_password)
      result.smtp_password = decrypt(result.smtp_password);
    if (result.zepto_api_key)
      result.zepto_api_key = decrypt(result.zepto_api_key);

    return res.status(200).json({ data: result });
  } catch (e) {
    console.log(e);
    throw e
  }
}
export async function UpdateWhatsappIntegration(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({ msg: "UnAuthorized" });
    }

    const user_id = new ObjectId(user.user_id);

    const parsed = whatsapp_integration_schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ msg: parsed.error.issues[0].message });
    }

    const tenant_key = `tenant_${user.tenant_id}`;
    const db = await getDb(tenant_key);
    const data = parsed.data;

    if (data.whatsapp_provider === "twilio") {
      await db.collection("integrations").updateOne(
        { type: "whatsapp" },
        {
          $set: {
            type: "whatsapp",
            provider: "twilio",
            twilio_account_sid: data.twilio_account_sid,
            twilio_auth_token: encrypt(data.twilio_auth_token),
            twilio_from_number: data.twilio_from_number,
            updated_by: user_id,
            updated_on: new Date(),
          },
        },
        { upsert: true },
      );
    } else {
      await db.collection("integrations").updateOne(
        { type: "whatsapp" },
        {
          $set: {
            type: "whatsapp",
            provider: "meta",
            meta_access_token: encrypt(data.meta_access_token),
            meta_phone_number_id: data.meta_phone_number_id,
            meta_business_account_id: data.meta_business_account_id,
            updated_by: user_id,
            updated_on: new Date(),
          },
        },
        { upsert: true },
      );
    }

    return res
      .status(200)
      .json({ success: true, msg: "WhatsApp settings saved" });
  } catch (e) {
    throw e
  }
}

export async function GetWhatsappDetails(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({ msg: "UnAuthorized" });
    }

    const tenant_key = `tenant_${user.tenant_id}`;
    const db = await getDb(tenant_key);

    const doc = await db
      .collection("integrations")
      .aggregate([
        { $match: { type: "whatsapp" } },
        {
          $lookup: {
            from: "users",
            localField: "updated_by",
            foreignField: "_id",
            as: "user_result",
          },
        },
        { $unwind: { path: "$user_result", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            provider: 1,
            twilio_account_sid: 1,
            twilio_auth_token: 1,
            twilio_from_number: 1,
            meta_access_token: 1,
            meta_phone_number_id: 1,
            meta_business_account_id: 1,
            automation_provider: 1,
            updated_on: 1,
            updated_by: "$user_result.name",
          },
        },
      ])
      .toArray();

    if (!doc || doc.length === 0) {
      return res.status(200).json({ data: null });
    }

    const result = doc[0];

    if (result.twilio_auth_token)
      result.twilio_auth_token = decrypt(result.twilio_auth_token);
    if (result.meta_access_token)
      result.meta_access_token = decrypt(result.meta_access_token);

    return res.status(200).json({ data: result });
  } catch (e) {
    console.log(e);
    throw e
  }
}
const active_provider_schema = z.object({
  email_provider: z.enum(["smtp", "zeptomail"]).optional(),
  whatsapp_provider: z.enum(["twilio", "meta"]).optional(),
  type: z.enum(["mail", "whatsapp"]),
});

export async function AutomationProviderStatus(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.user_id || !ObjectId.isValid(user.user_id)) {
      return res.status(401).json({ msg: "UnAuthorized" });
    }

    const parsed = active_provider_schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ msg: parsed.error.issues[0].message });
    }

    const { type, email_provider, whatsapp_provider } = parsed.data;

    const raw_provider = type === "mail" ? email_provider : whatsapp_provider;
    if (!raw_provider) {
      return res.status(400).json({ msg: "Provider is required" });
    }

    const provider_map: Record<string, number> = {
      smtp: APP_CONSTANTS.INTEGRATIONS_EMAIL.SMTP,
      zeptomail: APP_CONSTANTS.INTEGRATIONS_EMAIL.ZEPTO_MAIL,
      twilio: APP_CONSTANTS.INTEGRATIONS_WHATSAPP.TWILIO,
      meta: APP_CONSTANTS.INTEGRATIONS_WHATSAPP.META_CLOUD,
    };

    const provider = provider_map[raw_provider];

    const tenant_key = `tenant_${user.tenant_id}`;
    const db = await getDb(tenant_key);

    await db.collection("integrations").updateOne(
      { type },
      {
        $set: {
          automation_provider: provider,
          updated_by: new ObjectId(user.user_id),
          updated_on: new Date(),
        },
      },
    );

    return res.status(200).json({ success: true, msg: "Active provider updated" });
  } catch (e) {
    throw e
  }
}