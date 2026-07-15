const { spawn } = require('child_process');

const args = process.argv.slice(2);
const command = process.platform === 'win32' ? '"C:\\Program Files\\nodejs\\npx.cmd"' : 'npx';
const child = spawn(command, ['expo', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: require('path').resolve(__dirname, '..'),
  env: {
    ...process.env,
    EXPO_NO_TELEMETRY: '1'
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});