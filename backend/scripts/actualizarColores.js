const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://emgrgonzalezr_db_user:Seve2025@cluster0.okezi9s.mongodb.net/seve?appName=Cluster0';

const colorSchema = new mongoose.Schema({ nombre: { type: String, required: true, unique: true, trim: true } });
const ColorProducto = mongoose.model('ColorProducto', colorSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB');

  // Eliminar amarillo si existe
  const eliminado = await ColorProducto.findOneAndDelete({ nombre: 'amarillo' });
  if (eliminado) console.log('✓ Eliminado: amarillo');

  // Agregar naranja y negro si no existen
  for (const nombre of ['naranja', 'negro']) {
    const existe = await ColorProducto.findOne({ nombre });
    if (!existe) {
      await ColorProducto.create({ nombre });
      console.log(`✓ Agregado: ${nombre}`);
    } else {
      console.log(`- Ya existe: ${nombre}`);
    }
  }

  const todos = await ColorProducto.find().sort({ nombre: 1 });
  console.log('\nColores actuales:', todos.map(c => c.nombre).join(', '));

  await mongoose.disconnect();
  console.log('Listo.');
}

run().catch(err => { console.error(err); process.exit(1); });
