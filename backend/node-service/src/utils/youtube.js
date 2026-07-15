const { logger } = require('../middleware/logger');

let cachedInvidiousInstances = [
  'invidious.f5.si',
  'inv.zoomerville.com',
  'invidious.nerdvpn.de',
  'invidious.projectsegfaut.im',
  'invidious.privacydev.net',
  'invidious.no-logs.com'
];
let healthyInstancesList = [...cachedInvidiousInstances];
let lastWorkingInstance = 'invidious.f5.si';
let lastFetchTime = 0;

async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function refreshInvidiousInstances() {
  const now = Date.now();
  if (now - lastFetchTime < 3600000 && cachedInvidiousInstances.length > 5) {
    return;
  }
  try {
    const response = await fetchWithTimeout('https://api.invidious.io/instances.json', {}, 4000);
    if (response.ok) {
      const data = await response.json();
      const list = [];
      for (const item of data) {
        const domain = item[0];
        const details = item[1];
        if (details && details.type === 'https' && details.monitor && details.monitor.ssl && details.monitor.ssl.valid === true) {
          if (!domain.includes('.onion') && !domain.includes('.i2p') && !domain.includes('.ygg') && !domain.includes('nadeko')) {
            list.push(domain);
          }
        }
      }
      if (list.length > 0) {
        cachedInvidiousInstances = Array.from(new Set([
          'invidious.f5.si',
          'inv.zoomerville.com',
          ...list
        ]));
        lastFetchTime = now;
      }
    }
  } catch (err) {
    logger.error(`Failed to fetch Invidious instances directory: ${err.message}`);
  }
}

const resolvedStreamCache = {};
const STREAM_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

async function getYouTubeAudioUrl(videoId) {
  // Check memory cache first to yield zero-latency (0ms) resolution
  const cached = resolvedStreamCache[videoId];
  if (cached && (Date.now() - cached.timestamp < STREAM_CACHE_TTL)) {
    logger.info(`Resolved stream URL in 0ms from memory cache for video: ${videoId}`);
    return cached.url;
  }

  await refreshInvidiousInstances();

  // Consolidate candidates sequentially starting with the last working instance
  const candidates = [
    lastWorkingInstance,
    ...healthyInstancesList.filter(inst => inst && inst !== lastWorkingInstance),
    ...cachedInvidiousInstances.filter(inst => inst && !healthyInstancesList.includes(inst))
  ].filter(Boolean).slice(0, 4);

  // Try the last working instance first synchronously to avoid extra queries
  if (lastWorkingInstance) {
    try {
      const testUrl = `https://${lastWorkingInstance}/latest_version?id=${videoId}&itag=140&local=true`;
      const response = await fetchWithTimeout(testUrl, { method: 'HEAD', redirect: 'follow' }, 2200);
      const contentType = response.headers.get('content-type') || '';
      const isMedia = contentType.startsWith('audio/') || contentType.startsWith('video/') || contentType.startsWith('application/octet-stream');

      if (response.status === 200 && isMedia) {
        resolvedStreamCache[videoId] = { url: testUrl, timestamp: Date.now() };
        return testUrl;
      }
    } catch (err) {
      // Last working instance failed, try other candidates in parallel
    }
  }

  // Query remaining candidates in parallel to guarantee sub-3-second responses
  const remainingCandidates = candidates.filter(inst => inst !== lastWorkingInstance).slice(0, 3);
  if (remainingCandidates.length > 0) {
    const promises = remainingCandidates.map(async (inst) => {
      const testUrl = `https://${inst}/latest_version?id=${videoId}&itag=140&local=true`;
      const response = await fetchWithTimeout(testUrl, { method: 'HEAD', redirect: 'follow' }, 2200);
      const contentType = response.headers.get('content-type') || '';
      const isMedia = contentType.startsWith('audio/') || contentType.startsWith('video/') || contentType.startsWith('application/octet-stream');
      if (response.status === 200 && isMedia) {
        return { inst, url: testUrl };
      }
      throw new Error('Not media');
    });

    try {
      const winner = await Promise.any(promises);
      lastWorkingInstance = winner.inst;
      if (!healthyInstancesList.includes(winner.inst)) {
        healthyInstancesList.unshift(winner.inst);
        healthyInstancesList = healthyInstancesList.slice(0, 10);
      }
      resolvedStreamCache[videoId] = { url: winner.url, timestamp: Date.now() };
      return winner.url;
    } catch (e) {
      // All parallel checks failed
    }
  }

  // Trigger background health check to refresh the healthy list
  findHealthyInstancesInBackground().catch(() => null);

  return null;
}

async function findHealthyInstancesInBackground() {
  await refreshInvidiousInstances();

  const candidates = [
    lastWorkingInstance,
    ...cachedInvidiousInstances.filter(inst => inst && inst !== lastWorkingInstance)
  ].filter(Boolean);

  const testVideoId = 'dQw4w9WgXcQ'; // Rickroll
  const healthyList = [];

  for (const inst of candidates) {
    if (healthyList.length >= 8) break;
    try {
      const testUrl = `https://${inst}/latest_version?id=${testVideoId}&itag=140&local=true`;
      const response = await fetchWithTimeout(testUrl, { method: 'HEAD', redirect: 'follow' }, 5000);
      const contentType = response.headers.get('content-type') || '';
      const isMedia = contentType.startsWith('audio/') || contentType.startsWith('video/') || contentType.startsWith('application/octet-stream');

      if (response.status === 200 && isMedia) {
        healthyList.push(inst);
      }
    } catch (err) {
      // Ignore failures
    }
  }

  if (healthyList.length > 0) {
    healthyInstancesList = healthyList;
    lastWorkingInstance = healthyList[0];
    logger.info(`Updated background healthy instances cache: ${healthyList.join(', ')}`);
  }
}

// Initial background validation on startup
setTimeout(() => {
  findHealthyInstancesInBackground().catch(() => null);
}, 2000);

module.exports = {
  getYouTubeAudioUrl
};
