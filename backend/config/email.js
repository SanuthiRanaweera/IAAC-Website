const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// FIND LOCAL LOGO PATH FOR CID EMBEDDING
let validLogoPath = null;
try {
  const logoPaths = [
    path.join(__dirname, '..', 'assets', 'logo3.png'),
    path.join(__dirname, '..', '..', 'frontend', 'public', 'logo3.png'),
    path.join(__dirname, '..', 'public', 'logo3.png'),
  ];
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      validLogoPath = p;
      break;
    }
  }
} catch (_) { /* logo embedding is optional */ }

function readSmtpEnv() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

function createTransportFromConfig({ host, port, secure, user, pass }) {
  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing: set SMTP_HOST, SMTP_USER, SMTP_PASS');
  }
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(process.env.SMTP_ALLOW_SELF_SIGNED === 'true' ? { tls: { rejectUnauthorized: false } } : {}),
  });
  return transport;
}

async function getTransporter() {
  const testMode = (process.env.EMAIL_TEST_MODE || 'false').toLowerCase() === 'true';
  if (testMode) {
    const testAccount = await nodemailer.createTestAccount();
    const transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    if ((process.env.EMAIL_DEBUG || 'false').toLowerCase() === 'true') {
      console.log('[email] Using Ethereal test mode');
    }
    return transport;
  }
  const cfg = readSmtpEnv();
  const transport = createTransportFromConfig(cfg);
  if ((process.env.EMAIL_DEBUG || 'false').toLowerCase() === 'true') {
    const masked = cfg.user ? cfg.user.replace(/(.{2}).+(@.*)/, '$1***$2') : 'unknown';
    console.log(`[email] Using SMTP ${cfg.host}:${cfg.port} secure=${cfg.secure} user=${masked}`);
  }
  return transport;
}

function getRecipients() {
  const raw = process.env.NOTIFY_EMAILS || '';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.slice(0, 3); // ensure up to three recipients per requirement
}

function fromAddress() {
  return process.env.FROM_EMAIL || process.env.SMTP_USER;
}

async function sendApplicationNotifications(app) {
  let transporter = await getTransporter();
  const recipients = getRecipients();
  const debug = (process.env.EMAIL_DEBUG || 'false').toLowerCase() === 'true';
  const testMode = (process.env.EMAIL_TEST_MODE || 'false').toLowerCase() === 'true';

  if (recipients.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const subject = `New Application: ${app.firstName} ${app.lastName} - ${app.program}`;
  const lines = [
    'A new application has been submitted with the following details:',
    '',
    `Name: ${app.firstName} ${app.lastName}`,
    app.dob ? `DOB: ${new Date(app.dob).toLocaleDateString()}` : undefined,
    app.nic ? `NIC: ${app.nic}` : undefined,
    app.gender ? `Gender: ${app.gender}` : undefined,
    `Email: ${app.email}`,
    `Phone: ${app.phone}`,
    app.address ? `Address: ${app.address}` : undefined,
    `Program: ${app.program}`,
    '',
    `Submitted At: ${new Date(app.createdAt).toLocaleString()}`,
  ].filter(Boolean);

  const text = lines.join('\n');

  let sent = 0;
  let failed = 0;

  if (debug) {
    try {
      await transporter.verify();
      console.log('[email] SMTP connection verified');
    } catch (verifyErr) {
      const msg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr);
      console.error('[email] SMTP verify failed:', msg);
      if (/wrong version number|EPROTO|handshake|ESOCKET/i.test(msg)) {
        const envCfg = readSmtpEnv();
        const fallback = envCfg.secure || envCfg.port === 465
          ? { host: envCfg.host, port: 587, secure: false, user: envCfg.user, pass: envCfg.pass }
          : { host: envCfg.host, port: 465, secure: true, user: envCfg.user, pass: envCfg.pass };
        try {
          transporter = createTransportFromConfig(fallback);
          await transporter.verify();
          console.log('[email] Fallback SMTP connection verified');
        } catch (fallbackErr) {
          console.error('[email] Fallback SMTP verify failed:', fallbackErr);
        }
      }
    }
  } else {
    // Even without debug, attempt verify + fallback so emails actually send
    try {
      await transporter.verify();
    } catch (verifyErr) {
      const msg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr);
      if (/wrong version number|EPROTO|handshake|ESOCKET/i.test(msg)) {
        const envCfg = readSmtpEnv();
        const fallback = envCfg.secure || envCfg.port === 465
          ? { host: envCfg.host, port: 587, secure: false, user: envCfg.user, pass: envCfg.pass }
          : { host: envCfg.host, port: 465, secure: true, user: envCfg.user, pass: envCfg.pass };
        try {
          transporter = createTransportFromConfig(fallback);
          await transporter.verify();
        } catch (_) { /* will fail at sendMail below */ }
      }
    }
  }

  const previews = [];
  for (const to of recipients) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress(),
        to,
        subject,
        text,
      });
      if (testMode) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) previews.push(url);
      }
      sent += 1;
    } catch (err) {
      failed += 1;
    }
  }

  return { sent, failed, previews };
}

/**
 * Send approval/acceptance email to the student.
 */
async function sendApprovalEmail(app, applicationPdf) {
  let transporter = await getTransporter();
  const debug = (process.env.EMAIL_DEBUG || 'false').toLowerCase() === 'true';
  const testMode = (process.env.EMAIL_TEST_MODE || 'false').toLowerCase() === 'true';

  if (!app.email) {
    return { sent: false, error: 'No student email address' };
  }

  const studentName = app.fullName || `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Student';
  const programName = app.program || 'the selected program';
  const academyName = app.academy || 'IAAC';

  const siteUrl = process.env.FRONTEND_URL || 'https://iaacasia.com';

  // FIX: If we found a local file, we will attach it with CID "iaaclogo". 
  // Otherwise, fallback to the public web URL.
  const logoSrc = validLogoPath ? 'cid:iaaclogo' : `${siteUrl}/logo3.png`;

  const subject = `Congratulations! You Have Been Selected - ${academyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 24px; background-color: #ffffff; font-family: 'Times New Roman', Times, serif; color: #222222;">
      <div style="font-family: 'Times New Roman', Times, serif; max-width: 680px; margin: 0 auto; background: #ffffff;">
        <div style="padding: 24px 30px 20px; text-align: center; border-bottom: 1px solid #d9d9d9;">
          <img src="${logoSrc}" alt="IAAC Logo" style="width: 86px; height: auto; margin-bottom: 12px;" />
          <h1 style="color: #222222; font-size: 24px; margin: 0 0 6px; font-weight: bold;">International Airline and Aviation College</h1>
          <p style="color: #555555; font-size: 14px; margin: 0;">Official Admission Notification</p>
        </div>
        
        <div style="padding: 36px 30px 30px;">
          <p style="font-size: 16px; color: #222222; margin: 0 0 22px;">Dear <strong>${studentName}</strong>,</p>
          
          <p style="font-size: 15px; color: #222222; line-height: 1.7; margin: 0 0 20px;">
            We are delighted to inform you that your application for 
            <strong>${programName}</strong>
            at <strong>${academyName}</strong> has been reviewed and approved.
          </p>

          <p style="font-size: 15px; color: #222222; line-height: 1.7; margin: 0 0 20px;">The following steps are required to complete your enrollment:</p>
          <ol style="color: #222222; font-size: 15px; line-height: 1.8; padding-left: 24px; margin: 0 0 22px;">
            <li>Visit the <strong>${academyName}</strong> campus with your original documents.</li>
            <li>Bring your NIC/Passport, O/L results sheet, and two passport-size photographs.</li>
            <li>Complete the registration form and pay the initial enrollment fee.</li>
            <li>Collect your student ID and class schedule.</li>
          </ol>

          <p style="font-size: 15px; color: #cc0000; font-weight: bold; line-height: 1.7; margin: 22px 0;">Please print the attached application form and bring it with you when you visit the campus to complete your enrollment.</p>

          <p style="font-size: 15px; color: #cc0000; font-weight: bold; line-height: 1.7; margin: 22px 0;">Please complete your enrollment within 14 days of receiving this email to secure your seat.</p>

          <p style="font-size: 15px; color: #222222; line-height: 1.7; margin: 24px 0 0;">
            If you have any questions, feel free to contact us or visit the campus during working hours.
          </p>

          <p style="font-size: 15px; color: #222222; line-height: 1.7; margin: 28px 0 0;">
            Best regards,<br/>
            <strong>Admissions Office</strong><br/>
            International Airline and Aviation College (IAAC)
          </p>
        </div>
        
        <div style="border-top: 1px solid #d9d9d9; padding: 20px 10px 8px; text-align: center; color: #555555; font-size: 12px; line-height: 1.6;">
          <p style="margin: 0 0 8px;">IAAC City Academy: 49A Siri Dhamma Mawatha, Colombo 10 | +94 76 676 3777</p>
          <p style="margin: 0 0 8px;">IAAC Airport Academy: 261 Ven Baddegama Wimalawansa Mawatha, Colombo 10 | +94 76 278 2781</p>
          <p style="margin: 0 0 8px;">IAAC Kurunegala Center: No. 27, Mihindu Mawatha, Kurunegala | +94 76 676 3777</p>
          <p style="margin: 0;"><a href="${siteUrl}" style="color: #555555; text-decoration: none;">${siteUrl}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = [
    `Dear ${studentName},`,
    '',
    `Congratulations! Your application for ${programName} at ${academyName} has been approved.`,
    '',
    'Next Steps to Complete Your Enrollment:',
    `1. Visit the ${academyName} campus with your original documents`,
    '2. Bring your NIC/Passport, O/L results sheet, and 2 passport-size photos',
    '3. Complete the registration form and pay the initial enrollment fee',
    '4. Collect your student ID and class schedule',
    '',
    'Please print the attached application form and bring it with you when you visit the campus to complete your enrollment.',
    '',
    'Please complete your enrollment within 14 days of receiving this email to secure your seat.',
    '',
    'Best regards,',
    'Admissions Office',
  ].join('\n');

  // Verify SMTP connection and apply fallback if TLS/SSL issues arise
  if (debug) {
    try {
      await transporter.verify();
      console.log('[email] SMTP connection verified for approval email');
    } catch (verifyErr) {
      const msg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr);
      console.error('[email] SMTP verify failed (approval):', msg);
      if (/wrong version number|EPROTO|handshake|ESOCKET/i.test(msg)) {
        const envCfg = readSmtpEnv();
        const fallback = envCfg.secure || envCfg.port === 465
          ? { host: envCfg.host, port: 587, secure: false, user: envCfg.user, pass: envCfg.pass }
          : { host: envCfg.host, port: 465, secure: true, user: envCfg.user, pass: envCfg.pass };
        try {
          transporter = createTransportFromConfig(fallback);
          await transporter.verify();
          console.log('[email] Fallback SMTP connection verified for approval email');
        } catch (fallbackErr) {
          console.error('[email] Fallback SMTP verify failed (approval):', fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr);
        }
      }
    }
  } else {
    // Even without debug, attempt verify + fallback so emails actually send
    try {
      await transporter.verify();
    } catch (verifyErr) {
      const msg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr);
      if (/wrong version number|EPROTO|handshake|ESOCKET/i.test(msg)) {
        const envCfg = readSmtpEnv();
        const fallback = envCfg.secure || envCfg.port === 465
          ? { host: envCfg.host, port: 587, secure: false, user: envCfg.user, pass: envCfg.pass }
          : { host: envCfg.host, port: 465, secure: true, user: envCfg.user, pass: envCfg.pass };
        try {
          transporter = createTransportFromConfig(fallback);
          await transporter.verify();
        } catch (_) { /* will fail at sendMail below */ }
      }
    }
  }

  // SETUP MAIL OPTIONS (WITH ATTACHMENTS FOR CID)
  const mailOptions = {
    from: fromAddress(),
    to: app.email,
    subject,
    text,
    html,
    attachments: [] // Initialize empty
  };

  if (typeof applicationPdf === 'string' && applicationPdf.trim()) {
    const base64Pdf = applicationPdf
      .trim()
      .replace(/^data:application\/pdf[^,]*base64,/i, '');
    mailOptions.attachments.push({
      filename: 'Application_Form.pdf',
      content: Buffer.from(base64Pdf, 'base64'),
      contentType: 'application/pdf',
    });
  }

  // If local logo is found, attach it for CID embedding
  if (validLogoPath) {
    mailOptions.attachments.push({
      filename: 'logo3.png',
      path: validLogoPath,
      cid: 'iaaclogo' // Matches the "cid:iaaclogo" in the HTML string
    });
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    if (debug) {
      console.log(`[email] Approval email sent to ${app.email}: messageId=${info && info.messageId}`);
    }

    let preview = null;
    if (testMode) {
      preview = nodemailer.getTestMessageUrl(info);
    }

    return { sent: true, preview };
  } catch (err) {
    if (debug) {
      console.error(`[email] Failed to send approval email to ${app.email}:`, err && err.message ? err.message : err);
    }

    // Retry once with fallback transport on send failure
    try {
      const envCfg = readSmtpEnv();
      const fallback = envCfg.secure || envCfg.port === 465
        ? { host: envCfg.host, port: 587, secure: false, user: envCfg.user, pass: envCfg.pass }
        : { host: envCfg.host, port: 465, secure: true, user: envCfg.user, pass: envCfg.pass };
      const retryTransport = createTransportFromConfig(fallback);
      const info = await retryTransport.sendMail(mailOptions);

      if (debug) {
        console.log(`[email] Approval email sent via fallback to ${app.email}: messageId=${info && info.messageId}`);
      }

      let preview = null;
      if (testMode) {
        preview = nodemailer.getTestMessageUrl(info);
      }

      return { sent: true, preview };
    } catch (retryErr) {
      if (debug) {
        console.error(`[email] Fallback send also failed for ${app.email}:`, retryErr && retryErr.message ? retryErr.message : retryErr);
      }
      return { sent: false, error: err && err.message ? err.message : 'Email sending failed' };
    }
  }
}

// Module exports always belong at the bottom of the file
module.exports = { 
  sendApplicationNotifications, 
  sendApprovalEmail 
};