// ===== utils/ffmpeg.js =====
const { spawn } = require('child_process');
const path = require('path');
const logger = require('./logger');

class FFmpegConverter {
  constructor() {
    this.activeConversions = new Map();
  }

  async convert(inputPath, outputPath, onProgress) {
    const conversionId = Date.now();
    logger.info(`Iniciando conversão`, { 
      id: conversionId,
      input: inputPath, 
      output: outputPath 
    });

    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:v', 'prores_ks',
        '-profile:v', '3',
        '-c:a', 'pcm_s16le',
        '-progress', 'pipe:1',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', args);
      this.activeConversions.set(conversionId, ffmpeg);

      let duration = 0;
      let stderr = '';

      ffmpeg.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Extrair duração total
        const durationMatch = output.match(/duration=(\d+):(\d+):(\d+\.\d+)/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseFloat(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }

        // Extrair tempo atual
        const timeMatch = output.match(/out_time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch && duration > 0) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const progress = Math.min((currentTime / duration) * 100, 100);
          
          if (onProgress) {
            onProgress(progress, currentTime, duration);
          }
        }
      });

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        
        // Log de informações importantes do FFmpeg
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.includes('Duration:') || line.includes('Stream #')) {
            logger.info(`FFmpeg: ${line.trim()}`, { id: conversionId });
          }
        });
      });

      ffmpeg.on('close', (code) => {
        this.activeConversions.delete(conversionId);

        if (code === 0) {
          logger.success(`Conversão concluída com sucesso`, { 
            id: conversionId,
            output: outputPath 
          });
          resolve({ success: true, output: outputPath });
        } else {
          logger.error(`Conversão falhou com código ${code}`, { 
            id: conversionId,
            stderr: stderr.substring(0, 500) 
          });
          reject(new Error(stderr || `FFmpeg falhou com código ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        this.activeConversions.delete(conversionId);
        logger.error(`Erro ao executar FFmpeg`, { 
          id: conversionId,
          error: err.message 
        });
        reject(err);
      });
    });
  }

  async checkInstallation() {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      
      ffmpeg.on('close', (code) => {
        const isInstalled = code === 0;
        logger.info(`Verificação FFmpeg: ${isInstalled ? 'Instalado' : 'Não encontrado'}`);
        resolve(isInstalled);
      });

      ffmpeg.on('error', () => {
        logger.warn('FFmpeg não encontrado no sistema');
        resolve(false);
      });
    });
  }

  cancelConversion(conversionId) {
    const process = this.activeConversions.get(conversionId);
    if (process) {
      process.kill('SIGTERM');
      this.activeConversions.delete(conversionId);
      logger.warn(`Conversão cancelada`, { id: conversionId });
      return true;
    }
    return false;
  }
}

module.exports = new FFmpegConverter();


