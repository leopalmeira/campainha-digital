const axios = require('axios');

// URL of the backend server. Can be overridden by env variable or command line arg.
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || process.argv[2] || 'https://campainha-digital.onrender.com';

console.log(`[Ping Robot] Iniciando robô keep-alive...`);
console.log(`[Ping Robot] Alvo: ${BACKEND_URL}/api/ping`);
console.log(`[Ping Robot] Frequência: a cada 8 minutos`);

// Perform immediate ping on startup
const performPing = async () => {
  try {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [Ping Robot] Enviando ping para ${BACKEND_URL}/api/ping...`);
    const response = await axios.get(`${BACKEND_URL}/api/ping`);
    console.log(`[${ts}] [Ping Robot] Sucesso! Servidor respondeu:`, response.data);
  } catch (error) {
    const ts = new Date().toISOString();
    console.error(`[${ts}] [Ping Robot] Falha ao fazer ping:`, error.message);
  }
};

performPing();

// Set interval for every 8 minutes
setInterval(performPing, 8 * 60 * 1000);
