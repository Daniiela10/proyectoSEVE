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
  return nodemailer.createTransport(getPrimaryTransportOptions());
}

function getPrimaryTransportOptions() {
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE
    ? String(process.env.EMAIL_SECURE).toLowerCase() === 'true'
    : port === 465;

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: getEmailUser(),
      pass: getEmailPass(),
    },
  };
}

function getFallbackTransportOptions() {
  const primaryPort = Number(process.env.EMAIL_PORT || 587);
  const fallbackPort = primaryPort === 465 ? 587 : 465;
  const secure = fallbackPort === 465;

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: fallbackPort,
    secure,
    requireTLS: !secure,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: getEmailUser(),
      pass: getEmailPass(),
    },
  };
}

async function sendMail(mailOptions) {
  ensureEmailConfig();
  const attempts = [getPrimaryTransportOptions(), getFallbackTransportOptions()];
  let lastError = null;

  for (const options of attempts) {
    try {
      return await nodemailer.createTransport(options).sendMail(mailOptions);
    } catch (err) {
      lastError = err;
      err.emailAttempt = `${options.host}:${options.port}`;
      console.error(`Error enviando correo por ${options.host}:${options.port}:`, err.message || err);
    }
  }

  throw lastError;
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
    return 'No se pudo conectar con el servidor SMTP. Revisa la configuracion de EMAIL_HOST, EMAIL_USER y EMAIL_PASS.';
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
  sendMail,
};
