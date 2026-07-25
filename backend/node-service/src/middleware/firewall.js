const logger = require('./logger');

// Security Threat Metrics Tracking
const securityMetrics = {
  totalInspected: 0,
  blockedThreats: 0,
  violationsCount: 0,
  rateLimitHits: 0,
  startTime: new Date().toISOString()
};

// In-Memory IP Tracking Databases
const ipViolations = new Map(); // IP -> { count: number, resetAt: number }
const bannedIPs = new Map();   // IP -> unbanTimestamp: number
const rateLimitStores = new Map(); // StoreName -> Map(IP -> { count: number, resetAt: number })

// Security Pattern Regexes
const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /onload\s*=/i,
  /onerror\s*=/i,
  /<iframe\b[^>]*>/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i
];

const INJECTION_PATTERNS = [
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /\$where/i,
  /;\s*rm\s+/i,
  /\|\s*bash/i,
  /exec\s*\(/i
];

const TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /%00/
];

const BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /gobuster/i,
  /dirbuster/i,
  /w3af/i,
  /acunetix/i
];

/**
 * Get Client IP Address safely from headers or socket
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * Record a security violation for an IP and auto-ban if threshold exceeded (5 violations in 10 mins)
 */
function recordViolation(ip, reason, path) {
  securityMetrics.blockedThreats++;
  securityMetrics.violationsCount++;

  const now = Date.now();
  let record = ipViolations.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + 10 * 60 * 1000 }; // 10 minutes window
  }

  record.count++;
  ipViolations.set(ip, record);

  console.warn(`[SoundWave WAF Shield Warning] Security violation from IP ${ip} on ${path}. Reason: ${reason} (Violation #${record.count})`);

  // Auto-ban if 5 or more violations in 10 mins
  if (record.count >= 5) {
    const banUntil = now + 60 * 60 * 1000; // Ban for 1 hour
    bannedIPs.set(ip, banUntil);
    console.error(`[SoundWave WAF Shield AUTO-BAN] IP address ${ip} has been BANNED for 1 hour due to 5+ security violations.`);
  }
}

/**
 * Middleware: Check if client IP is currently banned
 */
function checkBannedIP(req, res, next) {
  const ip = getClientIP(req);
  const now = Date.now();
  const banUntil = bannedIPs.get(ip);

  if (banUntil) {
    if (now < banUntil) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_BANNED',
          message: 'Access denied. Your IP address has been temporarily banned due to security violations.',
          banExpiresInSeconds: Math.ceil((banUntil - now) / 1000)
        }
      });
    } else {
      bannedIPs.delete(ip); // Ban expired
    }
  }
  next();
}

/**
 * Middleware: Deep WAF Inspector (XSS, Injection, Traversal, Malicious Bots)
 */
function wafInspector(req, res, next) {
  securityMetrics.totalInspected++;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  // 1. Inspect User-Agent for known attack scanners
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      recordViolation(ip, `Malicious Bot Scanner Detected (${userAgent})`, req.path);
      return res.status(403).json({
        success: false,
        error: { code: 'WAF_BOT_BLOCKED', message: 'Automated vulnerability scanner request blocked by SoundWave WAF' }
      });
    }
  }

  // 2. Inspect URL Path for Path Traversal
  const fullUrl = decodeURIComponent(req.originalUrl || req.url || '');
  if (fullUrl.includes('..') || fullUrl.includes('%2e%2e') || fullUrl.includes('%00')) {
    recordViolation(ip, `Path Traversal Exploit (${fullUrl})`, req.path);
    return res.status(403).json({
      success: false,
      error: { code: 'WAF_TRAVERSAL_BLOCKED', message: 'Path traversal request blocked by SoundWave WAF' }
    });
  }

  // Helper function to inspect any input string or object
  const inspectValue = (val, location) => {
    if (!val) return null;
    const str = typeof val === 'string' ? val : JSON.stringify(val);

    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(str)) {
        return `XSS Attack Pattern in ${location}`;
      }
    }
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(str)) {
        return `Injection Attack Pattern in ${location}`;
      }
    }
    return null;
  };

  // 3. Inspect Query Parameters
  for (const [key, val] of Object.entries(req.query || {})) {
    const violation = inspectValue(val, `query param "${key}"`);
    if (violation) {
      recordViolation(ip, violation, req.path);
      return res.status(403).json({
        success: false,
        error: { code: 'WAF_INJECTION_BLOCKED', message: 'Malicious payload detected and blocked by SoundWave WAF' }
      });
    }
  }

  // 4. Inspect Body Payload
  if (req.body && typeof req.body === 'object') {
    for (const [key, val] of Object.entries(req.body)) {
      const violation = inspectValue(val, `body field "${key}"`);
      if (violation) {
        recordViolation(ip, violation, req.path);
        return res.status(403).json({
          success: false,
          error: { code: 'WAF_INJECTION_BLOCKED', message: 'Malicious body payload detected and blocked by SoundWave WAF' }
        });
      }
    }
  }

  next();
}

/**
 * Sliding Window Rate Limiter Generator
 */
function createRateLimiter(storeName, windowMs, maxRequests) {
  if (!rateLimitStores.has(storeName)) {
    rateLimitStores.set(storeName, new Map());
  }
  const store = rateLimitStores.get(storeName);

  return function rateLimiter(req, res, next) {
    const ip = getClientIP(req);
    const now = Date.now();
    let record = store.get(ip);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    record.count++;
    store.set(ip, record);

    // Set standard RateLimit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > maxRequests) {
      securityMetrics.rateLimitHits++;
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${Math.round(windowMs / 1000)}s allowed. Please wait before retrying.`,
          retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000)
        }
      });
    }

    next();
  };
}

/**
 * Returns security metrics and WAF health summary
 */
function getSecurityStatus() {
  return {
    status: 'ACTIVE',
    firewallEngine: 'SoundWave WAF Shield v2.0',
    totalInspectedRequests: securityMetrics.totalInspected,
    blockedThreatsCount: securityMetrics.blockedThreats,
    rateLimitHitsCount: securityMetrics.rateLimitHits,
    activeBannedIPsCount: bannedIPs.size,
    bannedIPsList: Array.from(bannedIPs.keys()),
    upSince: securityMetrics.startTime
  };
}

module.exports = {
  checkBannedIP,
  wafInspector,
  globalRateLimiter: createRateLimiter('global', 60 * 1000, 120), // 120 req / 1 min
  authRateLimiter: createRateLimiter('auth', 15 * 60 * 1000, 10),  // 10 req / 15 mins
  searchRateLimiter: createRateLimiter('search', 60 * 1000, 40), // 40 req / 1 min
  getSecurityStatus
};
