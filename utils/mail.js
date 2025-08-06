import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "markanddighe3@gmail.com",
    pass: "ubgkmxlfrovktztm",
  },
});

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: "markanddighe3@gmail.com",
    to: email,
    subject: "For Verification Email",
    text: `Your OTP for email verification is: ${otp}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          background-color: #ffffff;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          color: #333333;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777777;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Email Verification</h2>
        </div>
        <p>Dear User,</p>
        <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
        <div class="otp">${otp}</div>
      </div>
    </body>
    </html>
  `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
