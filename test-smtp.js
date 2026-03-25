const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("Environment check:");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS length:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true
});

async function test() {
  console.log("Verifying connection to Gmail...");
  try {
    const conn = await transporter.verify();
    console.log("Transporter verification successful:", conn);
  } catch (err) {
    console.error("Transporter verification failed:", err);
    process.exit(1);
  }

  console.log("Attempting to send an email...");
  try {
    const info = await transporter.sendMail({
      from: `"Metalix24 Security" <${process.env.SMTP_FROM}>`,
      to: "zhaya2013@gmail.com", // testing if it works
      subject: "Test SMTP from Metalix24",
      html: "<h1>If you see this, SMTP is working perfectly!</h1>"
    });
    console.log("sendEmail returned:", info);
  } catch (error) {
    console.error("sendEmail threw an error:", error);
  }
  process.exit(0);
}

test();
