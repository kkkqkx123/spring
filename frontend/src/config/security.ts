// Security configuration for production deployment

export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      ...(import.meta.env.PROD ? [] : ["'unsafe-eval'"]), // Only in development
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS libraries
      'https://fonts.googleapis.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'connect-src': [
      "'self'",
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
      ...(import.meta.env.VITE_SENTRY_DSN ? ['https://sentry.io'] : []),
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': import.meta.env.PROD ? [] : undefined,
  },

  // Security headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  },

  // Feature Policy
  FEATURE_POLICY: {
    camera: "'none'",
    microphone: "'none'",
    geolocation: "'none'",
    payment: "'none'",
    usb: "'none'",
    accelerometer: "'none'",
    gyroscope: "'none'",
    magnetometer: "'none'",
  },
};

// Generate CSP string
export const generateCSPString = (): string => {
  return Object.entries(SECURITY_CONFIG.CSP)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key} ${value.join(' ')}`;
      }
      return key;
    })
    .join('; ');
};

// Apply security headers to HTML
export const applySecurityHeaders = (): void => {
  if (typeof document === 'undefined') return;

  // Apply CSP via meta tag (fallback if server headers not available)
  if (import.meta.env.VITE_STRICT_CSP === 'true') {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = generateCSPString();
    document.head.appendChild(cspMeta);
  }

  // Apply other security headers via meta tags where possible
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate URLs
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Rate limiting for API calls
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Create global rate limiter instance
export const globalRateLimiter = new RateLimiter();

// Security utilities
export const SecurityUtils = {
  sanitizeInput,
  isValidUrl,
  generateCSPString,
  applySecurityHeaders,
  rateLimiter: globalRateLimiter,
};
