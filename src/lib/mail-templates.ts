import type { Mail } from "@/lib/mail";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://cocodaily.vercel.app";
const ACCENT = "#e11d48";

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f7f5;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e7e7e4;border-radius:14px;overflow:hidden">
      <tr><td style="padding:22px 28px;border-bottom:1px solid #eee">
        <span style="font-size:20px;font-weight:800;letter-spacing:-.02em">Coco</span>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:19px;font-weight:800">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #eee;font-size:12px;color:#8a8a86">
        Coco News · <a href="${SITE}" style="color:${ACCENT};text-decoration:none">${SITE.replace(/^https?:\/\//, "")}</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">${label}</a>`;
}

const p = (s: string) =>
  `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3a3a38">${s}</p>`;

export function welcomeReader(name: string): Omit<Mail, "to"> {
  return {
    subject: "Welcome to Coco News",
    html: shell("You're in.", [
      p(`Hi ${name}, your reader account is ready.`),
      p("You can now comment, save articles for later, and get the morning briefing."),
      button(`${SITE}`, "Start reading"),
    ].join("")),
  };
}

export function welcomeWriter(name: string): Omit<Mail, "to"> {
  return {
    subject: "Your Coco News contributor account",
    html: shell("Welcome to the desk.", [
      p(`Hi ${name}, your contributor account is active.`),
      p("You can write and edit your own drafts in the newsroom. An editor reviews and publishes each piece before it goes live."),
      button(`${SITE}/studio`, "Open the newsroom"),
    ].join("")),
  };
}

export function adminTempPassword(opts: {
  name: string;
  email: string;
  tempPassword: string;
}): Omit<Mail, "to"> {
  return {
    subject: "Your Coco News admin access",
    html: shell("Admin access", [
      p(`Hi ${opts.name}, an administrator account has been set up for <strong>${opts.email}</strong>.`),
      p(`Temporary password: <code style="background:#f2f2ef;padding:3px 7px;border-radius:5px;font-size:14px">${opts.tempPassword}</code>`),
      p("Sign in, then change it immediately from your account settings."),
      button(`${SITE}/login`, "Sign in"),
    ].join("")),
    text: `Admin account for ${opts.email}. Temporary password: ${opts.tempPassword}. Sign in at ${SITE}/login and change it from account settings.`,
  };
}

export function newWriterAlert(opts: { name: string; email: string }): Omit<Mail, "to"> {
  return {
    subject: `New contributor: ${opts.name}`,
    html: shell("A new contributor joined", [
      p(`<strong>${opts.name}</strong> (${opts.email}) just registered as a contributor and can start drafting.`),
      p("No action needed — their articles still require an editor to publish."),
      button(`${SITE}/studio`, "Open the newsroom"),
    ].join("")),
  };
}

export function passwordChanged(name: string): Omit<Mail, "to"> {
  return {
    subject: "Your Coco News password was changed",
    html: shell("Password updated", [
      p(`Hi ${name}, this is a confirmation that your password was just changed.`),
      p("If this wasn't you, contact an administrator right away."),
    ].join("")),
  };
}
