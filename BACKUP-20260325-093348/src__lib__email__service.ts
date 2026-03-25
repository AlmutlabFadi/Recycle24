import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error(`
      ======================================================
      [SMTP ERROR] Missing SMTP Configuration!
      Emails cannot be sent without SMTP credentials in .env
      Please add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
      
      [SIMULATED EMAIL TO: ${to}]
      ${html.replace(/<[^>]*>?/gm, '')}
      ======================================================
    `);
    // If not configured, we simulate success so the flow doesn't break during dev
    // But in production you may want to return false.
    return true; 
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465, 
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: SMTP_FROM ? `"Metalix24 System" <${SMTP_FROM}>` : `"Metalix24 System" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Real Email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending real email via SMTP:", error);
    return false;
  }
}
