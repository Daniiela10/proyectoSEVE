process.on('uncaughtException', (err) => {
  console.error('ERROR FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('PROMESA RECHAZADA:', reason);
  process.exit(1);
});

require('./backend/server');
