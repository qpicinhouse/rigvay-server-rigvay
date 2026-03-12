const nodemailer = require("nodemailer");

// Brevo SMTP configuration
const SMTP_HOST = "smtp-relay.brevo.com";
const SMTP_PORT = 587;
const SMTP_USER = "a4a999001@smtp-brevo.com"; // SMTP Login from Brevo
const SMTP_PASS = "xsmtpsib-d001ca0b20749a8d35fc055322ad4cee64aafb8dc0ee9cd0e66251fc0466f007-P5zkw6AAa0FvVVeC"; // Replace with your Brevo SMTP key

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send email function
const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sending email to:", to);

    const mailOptions = {
      from: '"Rigvay Team" <qpicmedia01@gmail.com>', // Verified sender
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

module.exports = { sendEmail };