'use strict';

async function sendPasswordResetEmail({ to, resetUrl }) {
  const user = process.env.GMAIL_USER || 'shop.carolina.eg@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    return {
      ok: false,
      skipped: true,
      reason: 'GMAIL_APP_PASSWORD is not set. Add a Gmail App Password in Vercel env vars.'
    };
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    return { ok: false, skipped: true, reason: 'nodemailer is not installed. Run npm install.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"Carolina Admin" <${user}>`,
    to,
    subject: 'Reset your Carolina admin password',
    text: [
      'You requested a password reset for the Carolina admin panel.',
      '',
      `Open this link to set a new username and password:`,
      resetUrl,
      '',
      'This link expires in 30 minutes. If you did not request this, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 520px; margin: 0 auto;">
        <h1 style="font-weight: 500; letter-spacing: 0.04em;">Carolina</h1>
        <p>You requested a password reset for the admin panel.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#c9a15c;color:#1a1a1a;padding:12px 22px;text-decoration:none;">Reset credentials</a></p>
        <p style="color:#5c564e;font-size:13px;">This link expires in 30 minutes. If you did not request this, ignore this email.</p>
      </div>
    `
  });

  return { ok: true };
}

module.exports = { sendPasswordResetEmail };
