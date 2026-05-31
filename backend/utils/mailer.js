const nodemailer = require('nodemailer');

function getEmailUser() {
  return String(process.env.EMAIL_USER || '').trim();
}

function getEmailPass() {
  return String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
}

function ensureEmailConfig() {
  if (!getEmailUser() || !getEmailPass()) {
    throw new Error('Faltan EMAIL_USER o EMAIL_PASS en variables de entorno');
  }
}

function createMailer() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 465),
    secure: String(process.env.EMAIL_SECURE || 'true') !== 'false',
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 25000,
    auth: {
      user: getEmailUser(),
      pass: getEmailPass(),
    },
  });
}

function getEmailFrom() {
  return `"SEVE Aluminios" <${getEmailUser()}>`;
}

module.exports = {
  createMailer,
  ensureEmailConfig,
  getEmailFrom,
};
