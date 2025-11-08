const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logFile = path.join(__dirname, '../logs', `app-${this.getDateString()}.log`);
    this.enableFileLogging = true; // Altere para false para desabilitar logs em arquivo
  }

  getDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = {}) {
    const timestamp = this.getTimestamp();
    const dataStr = Object.keys(data).length > 0 ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  writeToFile(message) {
    if (this.enableFileLogging) {
      try {
        fs.appendFileSync(this.logFile, message + '\n');
      } catch (err) {
        console.error('Erro ao escrever no arquivo de log:', err);
      }
    }
  }

  info(message, data = {}) {
    const formatted = this.formatMessage('INFO', message, data);
    console.log('\x1b[36m%s\x1b[0m', formatted);
    this.writeToFile(formatted);
  }

  success(message, data = {}) {
    const formatted = this.formatMessage('SUCCESS', message, data);
    console.log('\x1b[32m%s\x1b[0m', formatted);
    this.writeToFile(formatted);
  }

  warn(message, data = {}) {
    const formatted = this.formatMessage('WARN', message, data);
    console.log('\x1b[33m%s\x1b[0m', formatted);
    this.writeToFile(formatted);
  }

  error(message, data = {}) {
    const formatted = this.formatMessage('ERROR', message, data);
    console.log('\x1b[31m%s\x1b[0m', formatted);
    this.writeToFile(formatted);
  }
}

module.exports = new Logger();
