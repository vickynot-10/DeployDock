import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { encrypt } from "../helpers/Encryption";
import { getDb } from "../libs/mongodb";
import { isMongoError } from "../helpers/isMongoError";
import { generateToken } from "../libs/jwt";
import { sendMail } from "../services/mail.service";
import axios from "axios";
import { ObjectId } from "mongodb";

import { APP_CONSTANTS } from "../app.constants";
const AuthSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, "Password must be at least 8 characters"),
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty"),
});

const LoginAuthSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string({ error: "Password is required" })
    .trim()
    .min(8, "Password must be at least 8 characters"),
});

export async function SignUp(req: Request, res: Response) {
  try {
    const result = AuthSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { email, password, name } = result.data;
    const db = await getDb();

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      email,
      name,
      user_type: APP_CONSTANTS.USER_STATUS.ADMIN,
      password: hashedPassword,
      created_on: new Date(),
      updated_on: new Date(),
      tenant_id: randomUUID(),
      provider: "app",
    };

    const insertData = await db.collection("users").insertOne(payload);

    if (!insertData || !insertData.insertedId || !insertData.acknowledged) {
      return res.status(400).json({
        msg: "Failed to create user",
      });
    }

    const tenant_key = `tenant_${payload.tenant_id}`;

    const tenantDb = await getDb(tenant_key);
    await tenantDb.collection("users").insertOne({
      user_id: new ObjectId(insertData.insertedId),
      email,
      name,
      provider: "app",

      user_type: APP_CONSTANTS.USER_STATUS.ADMIN,
      created_on: new Date(),
      updated_on: new Date(),
    });

    const token = generateToken({
      user_id: insertData.insertedId,
      email: email,
      name: name,
      tenant_id: payload.tenant_id.toString(),
      provider: "app",
    });

    res.cookie("deploy_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      msg: "User created successfully",
      success: true,
      user_name: name ?? "User",
    });
  } catch (e) {
    if (isMongoError(e, 11000)) {
      return res.status(400).json({ msg: "User already exists" });
    }
throw e
  }
}

export async function SignIn(req: Request, res: Response) {
  try {
    const result = LoginAuthSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { email, password } = result.data;
    const db = await getDb();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }
    const token = generateToken({
      user_id: user._id,
      email: email,
      name: user.name,
      tenant_id: user.tenant_id.toString(),
      provider: "app",
    });
    res.cookie("deploy_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      msg: "Login successful",
      success: true,
      user_name: user.name ?? "User",
    });
  } catch (e) {
    console.error(e);
    throw e
  }
}

export async function SignOut(req: Request, res: Response) {
  try {
    res.clearCookie("deploy_auth", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      msg: "Logged out successfully",
      success: true,
    });
  } catch (e) {
    throw e
  }
}

export async function ForgetPassword(req: Request, res: Response) {
  try {
    const emailSchema = z.object({
      email: z.string().trim().toLowerCase().email("Invalid email"),
    });

    const result = emailSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { email } = result.data;
    const db = await getDb();

    const user = await db
      .collection("users")
      .findOne({ email, provider: "app" });

    if (!user) {
      return res.status(200).json({
        msg: "If this email exists, an OTP has been sent",
        success: true,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    const otp_expiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          reset_otp: hashedOtp,
          reset_otp_expiry: otp_expiry,
          updated_on: new Date(),
          provider: "app",
        },
      },
    );

    const details = {
      otp: otp,
      to_username: user.name,
    };

    try {
      await sendMail({
        to: email,
        subject: "Password Reset Verification Code",
        type: 1,
        text: `Your OTP is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
        details,
      });
    } catch (e) {
      throw e

    }

    return res.status(200).json({
      msg: "If this email exists, an OTP has been sent",
      success: true,
    });
  } catch (e) {
    throw e
  }
}

export async function VerifyOTP(req: Request, res: Response) {
  try {
    const schema = z.object({
      email: z.string().trim().toLowerCase().email("Invalid email"),
      otp: z.string().length(6, "OTP must be 6 digits"),
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { email, otp } = result.data;

    const db = await getDb();

    const user = await db.collection("users").findOne({ email });

    if (!user || !user.reset_otp || !user.reset_otp_expiry) {
      return res.status(400).json({
        msg: "Invalid or expired OTP",
      });
    }

    if (new Date() > new Date(user.reset_otp_expiry)) {
      return res.status(400).json({
        msg: "OTP has expired",
      });
    }

    const isMatch = await bcrypt.compare(otp, user.reset_otp);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid OTP",
      });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          otp_verified: true,
          updated_on: new Date(),
        },
      },
    );

    return res.status(200).json({
      msg: "OTP verified successfully",
      success: true,
    });
  } catch (e) {
    throw e
  }
}

export async function ResetPassword(req: Request, res: Response) {
  try {
    const schema = z.object({
      email: z.string().trim().toLowerCase().email("Invalid email"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { email, password } = result.data;

    const db = await getDb();

    const user = await db.collection("users").findOne({ email });

    if (!user || !user.otp_verified) {
      return res.status(400).json({
        msg: "OTP verification required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updated_on: new Date(),
        },
        $unset: {
          reset_otp: "",
          reset_otp_expiry: "",
          otp_verified: "",
        },
      },
    );

    return res.status(200).json({
      msg: "Password reset successful",
      success: true,
    });
  } catch (e) {
    throw e
  }
}

export async function ChangePasswordInApp(req: Request, res: Response) {
  try {
    const schema = z
      .object({
        current_password: z.string().min(6),
        new_password: z.string().min(6),
        confirm_password: z.string().min(6),
      })
      .superRefine((data, ctx) => {
        if (data.new_password !== data.confirm_password) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Passwords do not match",
            path: ["confirm_password"],
          });
        }
      });
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        msg: result.error.issues[0].message,
      });
    }

    const { current_password, new_password, confirm_password } = result.data;

    const db = await getDb();

    const user_id = (req as any).user.user_id;

    if (!user_id || !ObjectId.isValid(user_id)) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user_id) });

    if (!user) {
      return res.status(401).json({
        msg: "User Not Found, Unauthorized",
      });
    }

    if (user.provider === "github") {
      return res.status(200).json({
        msg: "Github Users cant change Passwords",
      });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Current password is incorrect",
      });
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.collection("users").updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashedPassword,
          updated_on: new Date(),
        },
      },
    );

    return res.status(200).json({
      msg: "Password Updated Successfully !",
      is_updated: true,
    });
  } catch (e) {
    throw e
  }
}

export async function GithubAuth(req: Request, res: Response) {
  try {
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        msg: "Invalid Credentials",
      });
    }
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user,repo`;

    res.redirect(redirectUrl);
  } catch (e) {
    console.error(e);
    throw e
  }
}

export async function GithubCallback(req: Request, res: Response) {
  try {
    const code = req.query.code as string;

    const CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } },
    );

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes?.data) {
      return res.status(400).json({ msg: "User not found" });
    }

    const githubUser = userRes.data;

    let email = githubUser.email;

    if (!email) {
      const emailsRes = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      email = emailsRes.data.find(
        (e: { email: string; primary: boolean; verified: boolean }) =>
          e.primary && e.verified,
      )?.email;
    }

    if (!email) {
      return res.status(400).send("GitHub email not available");
    }

    const db = await getDb();
    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    let user = await db.collection("users").findOne({ email });

    const encrypt_gh = encrypt(access_token);

    if (!user) {
      const newUser = {
        email,
        name: githubUser.name || githubUser.login,
        password: null,
        created_on: new Date(),
        updated_on: new Date(),

        user_type: APP_CONSTANTS.USER_STATUS.ADMIN,
        tenant_id: randomUUID(),
        github_id: githubUser.id,
        provider: "github",
        github_token: encrypt_gh,
      };

      try {
        const insert = await db.collection("users").insertOne(newUser);
        user = { ...newUser, _id: insert.insertedId };

        const tenant_key = `tenant_${newUser.tenant_id}`;
        const tenantDb = await getDb(tenant_key);
        await tenantDb.collection("users").insertOne({
          _id: new ObjectId(insert.insertedId),
          email,
          name: newUser.name,
          provider: "github",
          github_id: githubUser.id,
          created_on: new Date(),
          updated_on: new Date(),
        });
      } catch (e) {
        if (isMongoError(e, 11000)) {
          user = await db.collection("users").findOne({ email });
        } else {
          throw e;
        }
      }
    } else {
      await db.collection("users").updateOne(
        { email },
        {
          $set: {
            github_token: encrypt_gh,
            updated_on: new Date(),
          },
        },
      );
    }

    const token = generateToken({
      user_id: user!._id,
      email: user!.email,
      name: githubUser.name || githubUser.login,
      tenant_id: user!.tenant_id.toString(),
      provider: "github",
    });

    res.cookie("deploy_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const UI_URL = process.env.UI_APP!;
    res.redirect(UI_URL);
  } catch (e) {
    throw e
  }
}
export async function GetMEDetails(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }
    
    return res.status(200).json({
      name: user.name ?? "User",
      email: user.email,
      provider: user.provider,
      tenant_id : user.tenant_id
    });
  } catch  {
    return res.status(500).send("GitHub auth failed");
  }
}


