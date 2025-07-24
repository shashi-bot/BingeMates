import nodemailer from "nodemailer";

/**
 * Generates and sends a 6-digit OTP to the given email.
 * @param {string} email - Recipient's email
 * @returns {Promise<string>} - The generated OTP
 */
export const sendOtp = async (email) => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Email options
  const mailOptions = {
    from: "Bingemates<bingemates.noreply@gmail.com>",
    to: email,
    subject: "Your BingeMates OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hello from BingeMates! 👋</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; background: #f2f2f2; padding: 10px 20px; border-radius: 5px; display: inline-block;">
          ${otp}
        </div>
        <p>This OTP is valid for only a few minutes. Do not share it with anyone.</p>
      </div>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);

  return otp;
};
