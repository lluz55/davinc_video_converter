// ===== config/multer.js =====
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    logger.info(`Upload iniciado`, { 
      originalName: file.originalname,
      savedAs: uniqueName,
      size: file.size 
    });
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    logger.warn(`Arquivo rejeitado - extensão inválida`, { 
      filename: file.originalname,
      extension: ext 
    });
    cb(new Error(`Apenas arquivos de vídeo são permitidos. Extensão recebida: ${ext}`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB
  }
});

module.exports = upload;

