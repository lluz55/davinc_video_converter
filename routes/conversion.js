// ===== routes/conversion.js =====
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const ffmpeg = require('../utils/ffmpeg');
const logger = require('../utils/logger');

// WebSocket connections para progresso em tempo real
const progressClients = new Map();

router.get('/check-ffmpeg', async (req, res) => {
  const installed = await ffmpeg.checkInstallation();
  res.json({ installed });
});

router.post('/convert', async (req, res) => {
  const { files, outputDir } = req.body;
  
  if (!files || files.length === 0) {
    logger.warn('Tentativa de conversão sem arquivos');
    return res.status(400).json({ error: 'Nenhum arquivo para converter' });
  }

  const output = outputDir || config.outputDirectory;

  // Se um novo diretório de saída foi fornecido, atualize o config.json
  if (outputDir && outputDir !== config.outputDirectory) {
    config.outputDirectory = outputDir;
    fs.writeFileSync(
      path.join(__dirname, '..', 'config.json'), 
      JSON.stringify(config, null, 2)
    );
    logger.info(`Diretório de saída padrão atualizado para: ${outputDir}`);
  }
  
  logger.info(`Iniciando conversão em lote`, { 
    count: files.length,
    outputDir: output 
  });

  // Criar diretório de saída
  if (!fs.existsSync(output)) {
    try {
      fs.mkdirSync(output, { recursive: true });
      logger.info(`Diretório de saída criado`, { path: output });
    } catch (err) {
      logger.error(`Erro ao criar diretório de saída`, { 
        path: output,
        error: err.message 
      });
      return res.status(500).json({ 
        error: 'Erro ao criar diretório de saída: ' + err.message 
      });
    }
  }

  // Processar cada arquivo
  const results = [];
  let completedCount = 0;

  for (const file of files) {
    const inputPath = file.path;
    const outputFilename = path.basename(file.originalName, path.extname(file.originalName)) + '.mov';
    const outputPath = path.join(output, outputFilename);

    try {
      await ffmpeg.convert(inputPath, outputPath, (progress, currentTime, duration) => {
        // Enviar progresso via SSE (implementar se necessário)
        const progressData = {
          filename: file.originalName,
          progress: Math.round(progress),
          currentTime: currentTime.toFixed(2),
          duration: duration.toFixed(2),
          completed: completedCount,
          total: files.length
        };
        
        logger.info(`Progresso`, progressData);
      });

      // Remover arquivo original
      fs.unlinkSync(inputPath);
      logger.info(`Arquivo temporário removido`, { path: inputPath });

      results.push({
        file: file.originalName,
        status: 'success',
        output: outputPath
      });

      completedCount++;
      logger.success(`Arquivo convertido (${completedCount}/${files.length})`, { 
        file: file.originalName,
        output: outputPath 
      });

    } catch (err) {
      // Tentar remover arquivo temporário mesmo em caso de erro
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
      } catch (unlinkErr) {
        logger.error(`Erro ao remover arquivo temporário`, { 
          path: inputPath,
          error: unlinkErr.message 
        });
      }

      results.push({
        file: file.originalName,
        status: 'error',
        message: err.message
      });

      logger.error(`Falha na conversão`, { 
        file: file.originalName,
        error: err.message 
      });
    }
  }

  logger.info(`Conversão em lote finalizada`, { 
    total: files.length,
    success: results.filter(r => r.status === 'success').length,
    errors: results.filter(r => r.status === 'error').length
  });

  res.json({ results });
});

module.exports = router;


