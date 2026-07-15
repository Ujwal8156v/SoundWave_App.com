const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  // Prioritize active Wi-Fi adapters first
  const keys = Object.keys(interfaces).sort((a, b) => {
    const isWiFiA = a.toLowerCase().includes('wi-fi') || a.toLowerCase().includes('wireless');
    const isWiFiB = b.toLowerCase().includes('wi-fi') || b.toLowerCase().includes('wireless');
    if (isWiFiA && !isWiFiB) return -1;
    if (!isWiFiA && isWiFiB) return 1;
    return 0;
  });

  for (const interfaceName of keys) {
    const addresses = interfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Exclude virtual/hostspot helper subnets
        const nameLower = interfaceName.toLowerCase();
        if (nameLower.includes('virtual') || 
            nameLower.includes('docker') || 
            nameLower.includes('vbox') || 
            nameLower.includes('hostspot') ||
            addr.address.startsWith('192.168.56.')) {
          continue;
        }
        return addr.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();
console.log(`[SoundWave IP Sync] Detected local IPv4: ${localIp}`);

// Update mobile-app/.env
const mobileEnvPath = path.join(__dirname, '..', 'mobile-app', '.env');
if (fs.existsSync(mobileEnvPath)) {
  let content = fs.readFileSync(mobileEnvPath, 'utf8');
  content = content.replace(
    /EXPO_PUBLIC_API_BASE_URL=http:\/\/[0-9.]+:5000/g,
    `EXPO_PUBLIC_API_BASE_URL=http://${localIp}:5000`
  );
  fs.writeFileSync(mobileEnvPath, content, 'utf8');
  console.log(`[SoundWave IP Sync] Updated mobile-app/.env base URL to http://${localIp}:5000`);
}

// Update web-frontend/.env.local
const webEnvPath = path.join(__dirname, '..', 'web-frontend', '.env.local');
if (fs.existsSync(webEnvPath)) {
  let content = fs.readFileSync(webEnvPath, 'utf8');
  content = content.replace(
    /VITE_API_BASE_URL=http:\/\/[0-9.]+:5000/g,
    `VITE_API_BASE_URL=http://${localIp}:5000`
  );
  fs.writeFileSync(webEnvPath, content, 'utf8');
  console.log(`[SoundWave IP Sync] Updated web-frontend/.env.local base URL to http://${localIp}:5000`);
}

// Update web-frontend/js/api.js fallback target
const webApiPath = path.join(__dirname, '..', 'web-frontend', 'js', 'api.js');
if (fs.existsSync(webApiPath)) {
  let content = fs.readFileSync(webApiPath, 'utf8');
  content = content.replace(
    /:\s*'http:\/\/[0-9.]+:5000\/api\/v1'/g,
    `: 'http://${localIp}:5000/api/v1'`
  );
  fs.writeFileSync(webApiPath, content, 'utf8');
  console.log(`[SoundWave IP Sync] Updated web-frontend/js/api.js fallback to http://${localIp}:5000/api/v1`);
}
