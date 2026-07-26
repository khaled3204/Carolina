'use strict';

function getCredentials() {
  const user =
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    'shop.carolina.eg@gmail.com';

  const pass =
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.EMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS;

  return { user, pass };
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const { user, pass } = getCredentials();

  if (!pass) {
    return {
      ok: false,
      skipped: true,
      reason:
        'No email app password found. Set GMAIL_APP_PASSWORD (or EMAIL_PASS) in your Vercel env vars.'
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

  try {
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
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      reason: `Email send failed: ${err.message || 'unknown error'}. Double-check the app password is correct and 2-Step Verification is enabled on the Gmail account.`
    };
  }

  return { ok: true };
}

module.exports = { sendPasswordResetEmail };