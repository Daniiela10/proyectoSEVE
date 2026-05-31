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
  ensureEmailConfig();
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

function describeEmailError(err) {
  const code = err?.code || err?.responseCode || '';
  const response = String(err?.response || err?.message || '').trim();

  if (String(code) === 'EAUTH' || String(err?.responseCode) === '535') {
    return 'Gmail rechazo el acceso. Revisa que EMAIL_USER sea el correo correcto y que EMAIL_PASS sea una contrasena de aplicacion vigente.';
  }

  if (String(code) === 'ECONNECTION' || String(code) === 'ETIMEDOUT' || /connection/i.test(response)) {
    return 'No se pudo conectar con Gmail SMTP desde Render. Intenta redeploy/restart y revisa EMAIL_HOST/EMAIL_PORT si los configuraste.';
  }

  if (/Faltan EMAIL_USER|EMAIL_PASS/i.test(response)) {
    return response;
  }

  return response || 'No se pudo enviar el correo';
}

module.exports = {
  createMailer,
  describeEmailError,
  ensureEmailConfig,
  getEmailFrom,
};
