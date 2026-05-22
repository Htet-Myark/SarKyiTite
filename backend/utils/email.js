const nodemailer = require('nodemailer');

// Lazy transporter so env vars are always read after dotenv loads
function getTransporter() {
  return nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });
}

const FROM = '"Library System" <noreply@libraryms.com>';

const sendWarningEmail = async (toEmail, username, message) => {
  await getTransporter().sendMail({
    from: FROM,
    to: toEmail,
    subject: 'Library Warning Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #c0392b;">⚠️ Library Warning</h2>
        <p>Dear <strong>${username}</strong>,</p>
        <p>The library administrator has sent you the following warning:</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">${message}</p>
        </div>
        <p>Please log in to your library account to view details and take action.</p>
        <p style="color: #888; font-size: 13px;">This is an automated message from the Library Management System.</p>
      </div>
    `
  });
};

const sendAutoWarningEmail = async (toEmail, username, bookTitle, daysBorrowed) => {
  await getTransporter().sendMail({
    from: FROM,
    to: toEmail,
    subject: '📚 Reminder: Book Due Soon',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d97706;">⏰ Borrow Reminder</h2>
        <p>Dear <strong>${username}</strong>,</p>
        <p>You have had <strong>"${bookTitle}"</strong> for <strong>${daysBorrowed} days</strong>. Your loan period is 14 days.</p>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;">Please return the book before your due date to avoid penalties.</p>
        </div>
        <p>Log in to your account to check your due date or return the book early.</p>
        <p style="color: #888; font-size: 13px;">This is an automated reminder from the Library Management System.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
  await getTransporter().sendMail({
    from: FROM,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">🔒 Reset Your Password</h2>
        <p>Dear <strong>${username}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Reset Password</a>
        </div>
        <p style="color: #666;">This link will expire in <strong>1 hour</strong>.</p>
        <p style="color: #666;">If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color: #888; font-size: 13px;">This is an automated message from the Library Management System.</p>
      </div>
    `
  });
};

module.exports = { sendWarningEmail, sendAutoWarningEmail, sendPasswordResetEmail };
