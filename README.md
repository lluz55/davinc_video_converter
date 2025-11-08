
// ===== README.md =====
/*
# 🎬 Conversor de Vídeos para ProRes

Aplicação web completa para conversão de vídeos para formato ProRes com logging detalhado.

## 📁 Estrutura do Projeto

```
video-converter/
├── server.js                 # Servidor principal
├── package.json              # Dependências do projeto
├── config/
│   └── multer.js            # Configuração de upload
├── routes/
│   ├── upload.js            # Rotas de upload
│   └── conversion.js        # Rotas de conversão
├── utils/
│   ├── logger.js            # Sistema de logging
│   └── ffmpeg.js            # Gerenciador FFmpeg
├── public/
│   ├── index.html           # Interface web
│   └── js/
│       └── app.js           # JavaScript frontend
├── uploads/                  # Arquivos temporários
├── output/                   # Vídeos convertidos
└── logs/                     # Arquivos de log
```

## 🚀 Instalação

```bash
# 1. Clone ou crie o projeto
mkdir video-converter
cd video-converter

# 2. Instale as dependências
npm install express multer

# 3. Instale FFmpeg
# Windows: https://ffmpeg.org/download.html
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

## ❄️ Desenvolvimento com Nix

Se você tem o [Nix](https://nixos.org/) instalado, pode usar o `flake.nix` para obter um ambiente de desenvolvimento 100% reprodutível.

**1. Entre no Ambiente de Desenvolvimento**

Execute o seguinte comando na raiz do projeto. O Nix instalará automaticamente o `Node.js` e outras dependências definidas no `flake.nix`.

```bash
nix develop
```

**2. Instale as dependências do Node.js**

Uma vez dentro do shell do Nix, instale as dependências do projeto:

```bash
npm install
```

### ▶️ Como usar com Nix

Depois de entrar no shell com `nix develop`, você pode usar os mesmos comandos `npm`:

```bash
# Modo normal
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```

Alternativamente, você pode usar o comando `nix run` diretamente (sem precisar entrar no `nix develop`):

```bash
# Inicia o servidor (instala dependências do npm se necessário)
nix run .#

# Para especificar uma porta diferente (ex: 8080)
nix run .# -- --port 8080
```

## ▶️ Como usar

```bash
# Modo normal
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```

Acesse: `http://localhost:3000`

## ✨ Funcionalidades

### Interface Web
- ✅ Upload múltiplo com drag & drop
- ✅ Barra de progresso em tempo real
- ✅ Estatísticas detalhadas
- ✅ Feedback visual completo
- ✅ Suporte para diversos formatos

### Backend
- ✅ Logging colorido no console
- ✅ Logs salvos em arquivos diários
- ✅ Progresso real do FFmpeg
- ✅ Arquitetura modular
- ✅ Tratamento robusto de erros

### Logging
- 📊 Console: logs coloridos por tipo
- 📝 Arquivo: logs diários em `./logs/`
- 🎯 Níveis: INFO, SUCCESS, WARN, ERROR
- 📦 Formato: timestamp + tipo + mensagem + dados

## 🎨 Tipos de Log

```javascript
logger.info('Operação normal', { data });      // Cyan
logger.success('Sucesso', { data });           // Green
logger.warn('Aviso', { data });                // Yellow
logger.error('Erro', { data });                // Red
```

## ⚙️ Configuração

### Desabilitar logs em arquivo
Edite `utils/logger.js`:
```javascript
this.enableFileLogging = false;
```

### Alterar porta do servidor
Edite `server.js` ou use variável de ambiente:
```bash
PORT=8080 npm start
```

### Personalizar diretórios
Edite as constantes em `server.js`:
```javascript
const dirs = ['./uploads', './output', './logs'];
```

## 📊 Exemplo de Logs

```
[2025-01-15T10:30:15.123Z] [INFO] Servidor rodando na porta 3000
[2025-01-15T10:30:45.456Z] [INFO] Upload iniciado | {"originalName":"video.mp4","size":52428800}
[2025-01-15T10:31:02.789Z] [SUCCESS] Upload concluído | {"count":1}
[2025-01-15T10:31:03.012Z] [INFO] Iniciando conversão | {"id":1234567890,"input":"./uploads/video.mp4"}
[2025-01-15T10:35:28.345Z] [SUCCESS] Conversão concluída com sucesso | {"id":1234567890}
```

## 🔧 Comando FFmpeg Usado

```bash
ffmpeg -i <input> -c:v prores_ks -profile:v 3 -c:a pcm_s16le -progress pipe:1 -y <output>
```

## 📝 Notas

- Arquivos temporários são removidos automaticamente
- Logs são salvos em `./logs/app-YYYY-MM-DD.log`
- Limite de upload: 5GB por arquivo
- Máximo: 20 arquivos por vez
- Formatos suportados: MP4, AVI, MOV, MKV, WEBM, FLV, WMV

## 🐛 Solução de Problemas

### FFmpeg não encontrado
```bash
# Verifique a instalação
ffmpeg -version

# Adicione ao PATH se necessário
```

### Erro de permissão em diretórios
```bash
# Linux/Mac
chmod 755 uploads output logs

# Windows: execute como administrador
```

### Porta em uso
```bash
# Use outra porta
PORT=3001 npm start
```

## 📄 Licença

MIT
*
