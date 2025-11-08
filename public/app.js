let selectedFiles = [];
let uploadedFiles = [];

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDarkMode = body.classList.contains('dark-mode');
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Apply theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  themeToggle.textContent = '☀️';
}

// Verificar se FFmpeg está instalado
fetch('/api/check-ffmpeg')
  .then(res => res.json())
  .then(data => {
    if (!data.installed) {
      document.getElementById('ffmpegWarning').classList.add('show');
      document.getElementById('convertBtn').disabled = true;
    }
  });

const videoInput = document.getElementById('videoInput');
const dropZone = document.getElementById('dropZone');
const selectedFilesDiv = document.getElementById('selectedFiles');
const form = document.getElementById('convertForm');
const browseDirBtn = document.getElementById('browseDir');
const dirPicker = document.getElementById('dirPicker');
const outputDirInput = document.getElementById('outputDir');

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  handleFiles(files);
});

videoInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  handleFiles(files);
});

browseDirBtn.addEventListener('click', () => {
  dirPicker.click();
});

dirPicker.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    // A path de um diretório é relativa, então pegamos o caminho do primeiro arquivo
    // e removemos o nome do arquivo.
    const path = e.target.files[0].webkitRelativePath;
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (dir) {
      outputDirInput.value = dir;
    }
  }
});

function handleFiles(files) {
  selectedFiles = files;
  displaySelectedFiles();
}

function displaySelectedFiles() {
  if (selectedFiles.length === 0) {
    selectedFilesDiv.classList.remove('show');
    return;
  }

  selectedFilesDiv.classList.add('show');
  selectedFilesDiv.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: 600;">
      ${selectedFiles.length} arquivo(s) selecionado(s):
    </div>
  `;

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <span>📹 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
      <button type="button" onclick="removeFile(${index})">Remover</button>
    `;
    selectedFilesDiv.appendChild(fileItem);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  displaySelectedFiles();
}

async function uploadFiles() {
  const formData = new FormData();
  selectedFiles.forEach(file => {
    formData.append('videos', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Erro no upload dos arquivos');
  }

  const data = await response.json();
  return data.files;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (selectedFiles.length === 0) {
    alert('Por favor, selecione pelo menos um vídeo!');
    return;
  }

  const convertBtn = document.getElementById('convertBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const currentFileDiv = document.getElementById('currentFile');
  const resultsDiv = document.getElementById('results');
  const statCompleted = document.getElementById('statCompleted');
  const statTotal = document.getElementById('statTotal');
  const statProgress = document.getElementById('statProgress');

  convertBtn.disabled = true;
  convertBtn.textContent = 'Fazendo upload...';
  progressContainer.classList.add('show');
  resultsDiv.classList.remove('show');

  try {
    // Upload dos arquivos
    currentFileDiv.textContent = 'Fazendo upload dos arquivos...';
    progressFill.style.width = '10%';
    progressFill.textContent = '10%';
    
    uploadedFiles = await uploadFiles();
    
    currentFileDiv.textContent = 'Upload concluído! Iniciando conversão...';
    progressFill.style.width = '20%';
    progressFill.textContent = '20%';

    convertBtn.textContent = 'Convertendo...';
    statTotal.textContent = uploadedFiles.length;
    statCompleted.textContent = '0';

    // Conversão
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: uploadedFiles,
        outputDir: document.getElementById('outputDir').value
      })
    });

    const data = await response.json();

    // Simular progresso (já que o backend faz em lote)
    let completed = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      completed++;
      const progress = 20 + (completed / uploadedFiles.length) * 80;
      progressFill.style.width = `${progress}%`;
      progressFill.textContent = `${Math.round(progress)}%`;
      currentFileDiv.textContent = `Convertendo: ${uploadedFiles[i].originalName}`;
      statCompleted.textContent = completed;
      statProgress.textContent = `${Math.round(progress)}%`;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    progressFill.style.width = '100%';
    progressFill.textContent = '100%';
    progressText.textContent = 'Conversão concluída!';
    currentFileDiv.textContent = 'Todas as conversões foram finalizadas!';

    // Mostrar resultados
    resultsDiv.innerHTML = '<h3 style="margin-bottom: 15px;">Resultados:</h3>';
    
    const successCount = data.results.filter(r => r.status === 'success').length;
    const errorCount = data.results.filter(r => r.status === 'error').length;
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'stats';
    summaryDiv.innerHTML = `
      <div class="stat-item">
        <div class="stat-value" style="color: #28a745;">${successCount}</div>
        <div class="stat-label">Sucesso</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: #dc3545;">${errorCount}</div>
        <div class="stat-label">Erros</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.results.length}</div>
        <div class="stat-label">Total</div>
      </div>
    `;
    resultsDiv.appendChild(summaryDiv);

    data.results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = `result-item ${result.status}`;
      if (result.status === 'success') {
        resultItem.innerHTML = `
          <span class="icon">✅</span>
          <strong>${result.file}</strong> - Convertido com sucesso!<br>
          <small style="color: #666;">Salvo em: ${result.output}</small>
        `;
      } else {
        resultItem.innerHTML = `
          <span class="icon">❌</span>
          <strong>${result.file}</strong> - Erro na conversão<br>
          <small style="color: #721c24;">${result.message}</small>
        `;
      }
      resultsDiv.appendChild(resultItem);
    });
    resultsDiv.classList.add('show');

    // Limpar seleção
    selectedFiles = [];
    uploadedFiles = [];
    videoInput.value = '';
    displaySelectedFiles();

  } catch (error) {
    alert('Erro ao converter vídeos: ' + error.message);
    console.error(error);
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = 'Converter Vídeos';
  }
});
