const { fs } = require('./imports.js');

function loadConfig() {
  const configPath = './config.json'; // Adjust the path accordingly
  const configData = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

module.exports = loadConfig();
