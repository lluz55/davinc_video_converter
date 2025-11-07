// server.js
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de vídeo são permitidos!'));
    }
  }
});

app.use(express.static('public'));
app.use(express.json());

// Endpoint para converter vídeos
app.post('/convert', upload.array('videos', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const outputDir = req.body.outputDir || './output';
  
  // Criar diretório de saída se não existir
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao criar diretório de saída: ' + err.message });
    }
  }

  const results = [];

  for (const file of req.files) {
    const inputPath = file.path;
    const outputFilename = path.basename(file.originalname, path.extname(file.originalname)) + '.mov';
    const outputPath = path.join(outputDir, outputFilename);

    const command = `ffmpeg -i "${inputPath}" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${outputPath}"`;

    try {
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          // Remover arquivo original após conversão
          fs.unlinkSync(inputPath);
          
          if (error) {
            results.push({
              file: file.originalname,
              status: 'error',
              message: stderr || error.message
            });
            reject(error);
          } else {
            results.push({
              file: file.originalname,
              status: 'success',
              output: outputPath
            });
            resolve();
          }
        });
      });
    } catch (err) {
      // Erro já adicionado aos resultados
    }
  }

  res.json({ results });
});

// Endpoint para verificar se FFmpeg está instalado
app.get('/check-ffmpeg', (req, res) => {
  exec('ffmpeg -version', (error) => {
    if (error) {
      res.json({ installed: false });
    } else {
      res.json({ installed: true });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
