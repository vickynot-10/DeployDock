import nodemailer from "nodemailer";
export interface SendMailParams {
  to: string;
  subject: string;
  type: number;
  text?: string;
  details: any;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST as string ,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string,
  },
});

export const sendMail = async (payload: SendMailParams) => {
  try {
    const html_template: string = getHTMLTemplates(
      payload.type,
      payload.details,
    );

    const info = await transporter.sendMail({
      from: `DeployDock`,
      to: payload.to,
      subject: payload.subject,
      html: html_template,
      text: payload.text,
    });

    return info;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};
export function getHTMLTemplates(type: number, details: any): string {
  if (type === 1) {
    const { otp, to_username } = details;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your OTP Code</title>
   <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />

</head>
<body style="margin:0;padding:0; font-family: 'Poppins', sans-serif;background:#eceef2;font-size:14px;color:#2c3040;">

  <div style="max-width:620px;margin:0 auto;padding:40px 24px 60px;">

    <div style="
      background-color:#0d0d14;
  background-image:url(https://placehold.co/800x200/0f1011/7170ff?text=.);
      background-repeat:no-repeat;
      background-size:cover;
      background-position:center;
      border-radius:20px 20px 0 0;
      padding:32px 36px;
    ">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;font-family:'Outfit',sans-serif;">
              ⬡ DeployDock
            </span>
          </td>
          <td style="text-align:right;">
            <span style="font-size:13px;color:#8a8f98;font-family:'Outfit',sans-serif;">
              ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#ffffff;padding:52px 36px 48px;text-align:center;border-left:1px solid #d8dce6;border-right:1px solid #d8dce6;">
      <div style="max-width:420px;margin:0 auto;">

    
     

        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f1011;letter-spacing:-0.3px;font-family:'Outfit',sans-serif;">
          Your OTP
        </h1>

        <p style="margin:0 0 8px;font-size:16px;font-weight:500;color:#0f1011;font-family:'Outfit',sans-serif;">
          Hey ${to_username},
        </p>

        <p style="margin:0 0 36px;font-size:14px;line-height:1.7;color:#5a6070;font-family:'Outfit',sans-serif;">
          Use the one-time code below to reset your password. This code is valid for
          <strong style="color:#0f1011;font-weight:600;">5 minutes</strong>.
          Do not share this code with anyone, including DeployDock support.
        </p>

        <!-- OTP BOX -->
        <div style="background:#f4f5f7;border:1px solid #d8dce6;border-radius:16px;padding:32px 20px;margin-bottom:32px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#8a909a;letter-spacing:2.5px;text-transform:uppercase;font-family:'Outfit',sans-serif;">
            One-Time Passcode
          </p>
          <!-- Poppins only on OTP digits -->
          <p style="margin:0;font-size:44px;font-weight:700;letter-spacing:14px;color:#7170ff;font-family:'Poppins','Outfit',sans-serif;">
            ${otp}
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:#a8afbe;font-family:'Outfit',sans-serif;">
        
          ⏱ Expires in <strong style="color:#5a6070;">5 minutes</strong>
            
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#8a909a;line-height:1.6;font-family:'Outfit',sans-serif;">
          Didn't request this? You can safely ignore this email —<br/>your account has not been changed.
        </p>

      </div>
    </div>

    <div style="
      background:#ffffff;
      border-top:1px solid #e4e7ed;
      border-left:1px solid #d8dce6;
      border-right:1px solid #d8dce6;
      border-bottom:1px solid #d8dce6;
      border-radius:0 0 20px 20px;
      padding:28px 36px 32px;
      text-align:center;
    ">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2c3040;font-family:'Outfit',sans-serif;">
        DeployDock
      </p>
      <p style="margin:0 0 16px;font-size:12px;color:#8a909a;font-family:'Outfit',sans-serif;">
        Need help? Email us at
        <a href="mailto:support@deploydock.app" style="color:#7170ff;text-decoration:none;">support@deploydock.app</a>
      </p>
      <p style="margin:0;font-size:11px;color:#a8afbe;font-family:'Outfit',sans-serif;">
        © ${new Date().getFullYear()} DeployDock. All rights reserved.
      </p>
    </div>

  </div>

</body>
</html>`;
  }

  if (type === 2) {
    const { subject, body, project_name, deployment_link } = details;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;font-family:'Poppins',sans-serif;background:#eceef2;font-size:14px;color:#2c3040;">

  <div style="max-width:620px;margin:0 auto;padding:40px 24px 60px;">

    <div style="
      background-color:#0d0d14;
      background-image:url(https://placehold.co/800x200/0f1011/7170ff?text=.);
      background-repeat:no-repeat;
      background-size:cover;
      background-position:center;
      border-radius:20px 20px 0 0;
      padding:32px 36px;
    ">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;font-family:'Outfit',sans-serif;">
              ⬡ DeployDock
            </span>
          </td>
          <td style="text-align:right;">
            <span style="font-size:13px;color:#8a8f98;font-family:'Outfit',sans-serif;">
              ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#ffffff;padding:52px 36px 48px;border-left:1px solid #d8dce6;border-right:1px solid #d8dce6;">
      <div style="max-width:420px;margin:0 auto;">
 ${
   project_name
     ? `
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#8a909a;letter-spacing:2px;text-transform:uppercase;font-family:'Outfit',sans-serif;">
        Project
      </p>
      <p style="margin:0 0 28px;font-size:15px;font-weight:600;color:#0f1011;font-family:'Outfit',sans-serif;">
        ${project_name}
      </p>`
     : ""
 }
        <h1 style="margin:0 0 32px;font-size:22px;font-weight:700;color:#0f1011;letter-spacing:-0.3px;font-family:'Outfit',sans-serif;">
          ${subject}
        </h1>

        <div style="font-size:14px;line-height:1.8;color:#5a6070;font-family:'Outfit',sans-serif;">
          ${body}
        </div>

              ${
                deployment_link
                  ? `
      <div style="margin-top:36px;text-align:center;">
        <a href="${deployment_link}" style="
          display:inline-block;
          background:#7170ff;
          color:#ffffff;
          font-size:14px;
          font-weight:600;
          font-family:'Outfit',sans-serif;
          text-decoration:none;
          padding:14px 32px;
          border-radius:10px;
          letter-spacing:0.2px;
        ">View Deployment Logs →</a>
      </div>`
                  : ""
              }

      </div>
    </div>

    <div style="
      background:#ffffff;
      border-top:1px solid #e4e7ed;
      border-left:1px solid #d8dce6;
      border-right:1px solid #d8dce6;
      border-bottom:1px solid #d8dce6;
      border-radius:0 0 20px 20px;
      padding:28px 36px 32px;
      text-align:center;
    ">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2c3040;font-family:'Outfit',sans-serif;">
        DeployDock
      </p>
      <p style="margin:0 0 16px;font-size:12px;color:#8a909a;font-family:'Outfit',sans-serif;">
        Need help? Email us at
        <a href="mailto:support@deploydock.app" style="color:#7170ff;text-decoration:none;">support@deploydock.app</a>
      </p>
      <p style="margin:0;font-size:11px;color:#a8afbe;font-family:'Outfit',sans-serif;">
        © ${new Date().getFullYear()} DeployDock. All rights reserved.
      </p>
    </div>

  </div>

</body>
</html>`;
  }



  return "";
}
