// ===== server.js =====
const express = require('express');
const path = require('path');
const fs = require('fs');
const uploadRoutes = require('./routes/upload');
const conversionRoutes = require('./routes/conversion');
const logger = require('./utils/logger');

const app = express();

const config = require('./config.json');

// Middlewares
app.use(express.static('public'));
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Rotas
app.use('/api', uploadRoutes);
app.use('/api', conversionRoutes);

// Criar diretórios necessários
const dirs = ['./uploads', './logs', config.outputDirectory];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Diretório criado: ${dir}`);
  }
});

// Tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Erro na aplicação', { error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || config.port;
const HOST = process.env.HOST || config.host;

app.listen(PORT, HOST, () => {
  logger.info(`Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`\n🚀 Servidor iniciado!`);
  console.log(`📍 Acesse em sua rede: http://${HOST}:${PORT}\n`);
});
