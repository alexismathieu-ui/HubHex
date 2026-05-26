const nodemailer = require("nodemailer");
const { env } = require("../config/env");

let transporter = null;

const isSmtpConfigured = () =>
  Boolean(env.SMTP_HOST && env.SMTP_FROM && (env.SMTP_USER ? env.SMTP_PASS : true));

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }
  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "HubHex — reinitialisation du mot de passe",
    text: `Bonjour,\n\nPour reinitialiser votre mot de passe HubHex, ouvrez ce lien (valide 1 heure) :\n${resetUrl}\n\nSi vous n'avez pas demande cette action, ignorez ce message.\n\n— HubHex`,
    html: `<p>Bonjour,</p><p>Pour reinitialiser votre mot de passe HubHex, <a href="${resetUrl}">cliquez ici</a> (lien valide 1 heure).</p><p>Si vous n'avez pas demande cette action, ignorez ce message.</p><p>— HubHex</p>`,
  });
  return true;
};

module.exports = { sendPasswordResetEmail, isSmtpConfigured };
