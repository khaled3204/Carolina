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

function getTransporter() {
  const { user, pass } = getCredentials();
  if (!pass) return { transporter: null, user, error: 'No email app password configured' };

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    return { transporter: null, user, error: 'nodemailer is not installed. Run npm install.' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  return { transporter, user, error: null };
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const { transporter, user, error } = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      skipped: true,
      reason: error || 'Email is not configured. Set GMAIL_APP_PASSWORD (or EMAIL_PASS) in your Vercel env vars.'
    };
  }

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

async function sendContactMessage({ name, email, message }) {
  const { transporter, user, error } = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      skipped: true,
      reason: error || 'Email is not configured. Set GMAIL_APP_PASSWORD (or EMAIL_PASS) in your Vercel env vars.'
    };
  }

  try {
    await transporter.sendMail({
      from: `"Carolina Website" <${user}>`,
      to: user,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        'Message:',
        message
      ].join('\n'),
      html: `
        <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 520px; margin: 0 auto;">
          <h1 style="font-weight: 500; letter-spacing: 0.04em;">Carolina — New Contact Message</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background:#f5f0e6; padding:14px; border-radius:4px;">${message}</p>
          <p style="color:#5c564e;font-size:13px;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `
    });
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      reason: `Email send failed: ${err.message || 'unknown error'}.`
    };
  }

  return { ok: true };
}

async function sendVerificationCodeEmail({ to, code, isAdmin, adminUrl }) {
  const { transporter, user, error } = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      skipped: true,
      reason: error || 'Email is not configured. Set GMAIL_APP_PASSWORD (or EMAIL_PASS) in your Vercel env vars.'
    };
  }

  try {
    await transporter.sendMail({
      from: `"Carolina" <${user}>`,
      to,
      replyTo: user,
      subject: isAdmin ? 'Welcome Admin — your Carolina sign-in code' : `Your Carolina sign-in code`,
      text: [
        'Carolina',
        '',
        isAdmin ? 'Welcome Admin!' : null,
        `Your verification code is ${code}.`,
        '',
        'Enter this code on the Carolina website to sign in.',
        'This code expires in 10 minutes.',
        isAdmin && adminUrl ? '' : null,
        isAdmin && adminUrl ? `Go straight to the admin panel: ${adminUrl}` : null,
        '',
        'If you did not request this, you can ignore this email.',
        '',
        '— Carolina'
      ]
        .filter((line) => line !== null)
        .join('\n'),
      html: `
        <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="font-weight: 500; letter-spacing: 0.04em; color: #c9a15c;">Carolina</h1>
          ${isAdmin ? '<p style="font-size:18px;font-weight:700;margin:0 0 8px;">Welcome Admin!</p>' : ''}
          <p>Use this code to sign in to your Carolina account:</p>
          <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; background:#f5f0e6; padding: 16px 20px; text-align:center; border-radius: 4px;">${code}</p>
          <p style="color:#5c564e;font-size:13px;">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
          ${
            isAdmin && adminUrl
              ? `<p style="margin-top:20px;"><a href="${adminUrl}" style="display:inline-block;background:#c9a15c;color:#1a1a1a;padding:12px 22px;text-decoration:none;">Open admin panel</a></p>`
              : ''
          }
        </div>
      `,
      headers: {
        'X-Entity-Ref-ID': `carolina-otp-${Date.now()}`,
        Precedence: 'bulk'
      }
    });
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      reason: `Email send failed: ${err.message || 'unknown error'}.`
    };
  }

  return { ok: true };
}

async function sendOrderConfirmationEmail({ to, order }) {
  const { transporter, user, error } = getTransporter();
  if (!transporter) {
    return {
      ok: false,
      skipped: true,
      reason: error || 'Email is not configured. Set GMAIL_APP_PASSWORD (or EMAIL_PASS) in your Vercel env vars.'
    };
  }

  const itemsText = (order.items || [])
    .map((i) => `  ${i.qty} x ${i.name} (${i.color}/${i.size}) — ${i.lineTotal.toFixed(2)} EGP`)
    .join('\n');

  const itemsHtml = (order.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;">${i.qty} × ${i.name} <span style="color:#8a8578">(${i.color}/${i.size})</span></td>
        <td style="padding:8px 0;text-align:right;">${i.lineTotal.toFixed(2)} EGP</td>
      </tr>`
    )
    .join('');

  try {
    await transporter.sendMail({
      from: `"Carolina" <${user}>`,
      to,
      subject: `Order confirmed — your Carolina code is ${order.id}`,
      text: [
        `Thank you for your order!`,
        '',
        `Order code: ${order.id}`,
        `Payment method: ${order.paymentMethod}`,
        '',
        itemsText,
        '',
        `Subtotal: ${order.subtotal.toFixed(2)} EGP`,
        `Shipping: ${order.shippingFee.toFixed(2)} EGP`,
        `Total: ${order.total.toFixed(2)} EGP`,
        '',
        'Keep this code — you can use it to look up your order any time.'
      ].join('\n'),
      html: `
        <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 520px; margin: 0 auto;">
          <h1 style="font-weight: 500; letter-spacing: 0.04em;">Carolina</h1>
          <p>Thank you for your order! Here is your receipt.</p>
          <p style="font-size: 22px; letter-spacing: 2px; font-weight: 700; background:#f5f0e6; padding: 12px 18px; display:inline-block;">${order.id}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            ${itemsHtml}
            <tr><td style="padding:8px 0;border-top:1px solid #ddd;">Subtotal</td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right;">${order.subtotal.toFixed(2)} EGP</td></tr>
            <tr><td style="padding:8px 0;">Shipping</td><td style="padding:8px 0;text-align:right;">${order.shippingFee.toFixed(2)} EGP</td></tr>
            <tr><td style="padding:8px 0;font-weight:700;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${order.total.toFixed(2)} EGP</td></tr>
          </table>
          <p style="color:#5c564e;font-size:13px;margin-top:16px;">Keep this order code — you can use it to look up your order any time.</p>
        </div>
      `
    });
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      reason: `Email send failed: ${err.message || 'unknown error'}.`
    };
  }

  return { ok: true };
}

module.exports = {
  sendPasswordResetEmail,
  sendContactMessage,
  sendVerificationCodeEmail,
  sendOrderConfirmationEmail
};