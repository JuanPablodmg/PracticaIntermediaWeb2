import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './config/index.js';
import app from './app.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Conectado a MongoDB');

    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
};

start();
