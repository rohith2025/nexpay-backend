import nodemailer from "nodemailer";

export async function sendEmail(loggedInUser, to, subject, text) {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.log("Email error: Missing EMAIL_USER/EMAIL_PASS in env.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });

    console.log("Sending email to:", to);
    if (!loggedInUser?.email) {
      console.log("Email error: Missing logged-in user email for Reply-To.");
      return false;
    }
    console.log("Reply-To:", loggedInUser.email);

    await transporter.sendMail({
      from: `"${loggedInUser?.name ?? "NexPay"} via NexPay" <${process.env.EMAIL_USER}>`,
      replyTo: loggedInUser.email,
      to: to,
      subject,
      text
    });

    return true;
  } catch (err) {
    console.log("Email error:", err?.message ?? err);
    return false;
  }
}

