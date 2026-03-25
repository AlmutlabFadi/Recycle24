import { sendEmail } from "./src/lib/email/service";
import dotenv from "dotenv";
dotenv.config();

console.log("Environment check:");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS length:", process.env.SMTP_PASS?.length || 0);

async function test() {
  console.log("Attempting to send an email...");
  try {
    const success = await sendEmail(
      "your-personal-email@gmail.com", // testing if it works
      "Test SMTP from Metalix24",
      "<h1>If you see this, SMTP is working perfectly!</h1>"
    );
    console.log("sendEmail returned:", success);
  } catch (error) {
    console.error("sendEmail threw an error:", error);
  }
  process.exit(0);
}

test();
