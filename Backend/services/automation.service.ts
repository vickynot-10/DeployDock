import nodemailer from "nodemailer";
import { SendMailClient } from "zeptomail";
import twilio from "twilio";
import axios from "axios";
import { getHTMLTemplates } from "./mail.service";
export async function SendSMTPMail(payload: any) {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_mail } =
      payload;
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_pass || !smtp_from_mail)
      throw new Error("Field is missing");

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: Number(smtp_port),
      secure: Number(smtp_port) === 465,
      auth: { user: smtp_user, pass: smtp_pass },
    });

    const recipients: string[] = Array.isArray(payload.to)
      ? payload.to
      : [payload.to];

    await transporter.sendMail({
      from: smtp_from_mail,
      to: recipients.join(", "),
      cc: payload.cc
        ? Array.isArray(payload.cc)
          ? payload.cc.join(", ")
          : payload.cc
        : undefined,
      subject: payload.subject,
      html: getHTMLTemplates(2, {
        subject: payload.subject,
        body: payload.body,
        project_name: payload.project_name,
        deployment_link: payload.deployment_link,
      }),
    });
  } catch (e: any) {
    throw new Error(`SMTP mail failed: ${e.message}`);
  }
}

export async function SendZeptoMail(payload: any) {
  try {
    const { zepto_token, zepto_url, zepto_from_mail } = payload;
    if (!zepto_token || !zepto_url || !zepto_from_mail)
      throw new Error("Field is missing");

    const client = new SendMailClient({ url: zepto_url, token: zepto_token });

    const recipients: string[] = Array.isArray(payload.to)
      ? payload.to
      : [payload.to];

    await client.sendMail({
      from: { address: zepto_from_mail, name: zepto_from_mail },
      to: recipients.map((addr) => ({
        email_address: { address: addr, name: payload.to_name ?? payload.to ?? addr },
      })),
      subject: payload.subject,
      htmlbody: getHTMLTemplates(2, {
        subject: payload.subject,
        body: payload.body,
        project_name: payload.project_name,
        deployment_link: payload.deployment_link,
      }),
    });
  } catch (e: any) {
    throw new Error(`Zepto mail failed: ${e.message}`);
  }
}

export async function SendTwilioWhatsapp(payload: any) {
  try {
    const { twilio_account_sid, twilio_auth_token, twilio_from_number } =
      payload;
    if (!twilio_account_sid || !twilio_auth_token || !twilio_from_number)
      throw new Error("Field is missing");

    const client = twilio(twilio_account_sid, twilio_auth_token);

    const recipients: string[] = Array.isArray(payload.to)
      ? payload.to
      : [payload.to];
    const message = payload.deployment_link
      ? `${payload.body}\n\nProject: ${payload.project_name}\nLogs: ${payload.deployment_link}`
      : payload.body;

    await Promise.all(
      recipients.map((number) =>
        client.messages.create({
          body: message,
          from: `whatsapp:${twilio_from_number}`,
          to: `whatsapp:${number}`,
        }),
      ),
    );
  } catch (e: any) {
    throw new Error(`Twilio WhatsApp failed: ${e.message}`);
  }
}

export async function SendMETAWhatsapp(payload: any) {
  try {
    const { meta_access_token, meta_phone_number_id } = payload;
    if (!meta_access_token || !meta_phone_number_id)
      throw new Error("Field is missing");

    const recipients: string[] = Array.isArray(payload.to)
      ? payload.to
      : [payload.to];
    const message = payload.deployment_link
      ? `${payload.body}\n\nProject: ${payload.project_name}\nLogs: ${payload.deployment_link}`
      : payload.body;
    await Promise.all(
      recipients.map((number) =>
        axios.post(
          `https://graph.facebook.com/v19.0/${meta_phone_number_id}/messages`,
          {
            messaging_product: "whatsapp",
            to: number,
            type: "text",
            text: { body: message },
          },
          {
            headers: {
              Authorization: `Bearer ${meta_access_token}`,
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );
  } catch (e: any) {
    throw new Error(`META WhatsApp failed: ${e.message}`);
  }
}
