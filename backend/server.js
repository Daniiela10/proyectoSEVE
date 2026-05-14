const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const frontendUrl = String(
  process.env.FRONTEND_URL || 'http://localhost:5173'
).trim();

app.use(cors({
    origin: frontendUrl,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/ubicaciones', require('./routes/ubicaciones'));
app.use('/api/pedidos/wompi', require('./routes/wompi'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/carrusel', require('./routes/carrusel'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => console.error('❌ Error MongoDB:', err));

app.get("/", (req, res) => {
    res.send("Backend SEVE funcionando correctamente");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>
    console.log(`🚀 Servidor en puerto ${PORT}`)
);