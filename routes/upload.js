// ===== routes/upload.js =====
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const logger = require('../utils/logger');

router.post('/upload', upload.array('videos', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    logger.warn('Tentativa de upload sem arquivos');
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const files = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    path: file.path
  }));

  logger.success(`Upload concluído`, { 
    count: files.length,
    files: files.map(f => f.originalName)
  });

  res.json({ files });
});

module.exports = router;

