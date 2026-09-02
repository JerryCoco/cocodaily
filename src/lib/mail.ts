import nodemailer, { type Transporter } from "nodemailer";

/**
 * Provider-agnostic transactional email over SMTP.
 * Works with Brevo, SendGrid, Mailgun, Amazon SES, Postmark, Mailjet — set the
 * SMTP_* vars for whichever you pick. With no SMTP_* configured, emails are
 * logged to the server console instead of sent, so local dev never breaks.
 */

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 587);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;

export const MAIL_FROM =
  process.env.MAIL_FROM || "Cocodaily <no-reply@cocodaily.vercel.app>";

export const mailEnabled = Boolean(HOST && USER && PASS);

let cached: Transporter | null = null;

function transport(): Transporter | null {
  if (!mailEnabled) return null;
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER, pass: PASS },
  });
  return cached;
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Send one email. Never throws — failures are logged and swallowed so a
 *  broken mailbox can't take down a signup flow. Returns whether it was sent. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = transport();
  if (!t) {
    console.info(
      `[mail:disabled] would send to ${mail.to} — "${mail.subject}"\n${
        mail.text ?? mail.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      }`,
    );
    return false;
  }
  try {
    await t.sendMail({
      from: MAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text ?? mail.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    return true;
  } catch (err) {
    console.error(`[mail] failed to send "${mail.subject}" to ${mail.to}`, err);
    return false;
  }
}
