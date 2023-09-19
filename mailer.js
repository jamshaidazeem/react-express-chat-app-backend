const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendVerificationEmail = (email, token) => {
  const emailVerificationLink = `${process.env.DOMAIN}/verifyEmail?token=${token}`;
  const emailVerificationTag = `<a href="${emailVerificationLink}">Verify Email</a>`;
  const emailVerificationMessage = `You have signed up for our website!, in order to verify your email you have received this email, 
  please click on the link below:<br>${emailVerificationTag}`;
  const options = {
    from: "jamshaid@idevnerds.com",
    to: email,
    subject: "Verification Email",
    html: emailVerificationMessage,
  };
  return transport.sendMail(options);
};

module.exports = { sendVerificationEmail };
