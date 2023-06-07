// APP
export const SRC_DIR = __dirname;
export const ROOT_DIR = process.cwd();
export const INSIDE_DOCKER = process.env.INSIDE_DOCKER === 'true';

// API
const httpPort = parseInt(process.env.HTTP_PORT, 10) || '127.0.0.1:8080';
export const HTTP_PORT = httpPort;

const httpsPort = parseInt(process.env.HTTPS_PORT, 10) || false;
export const HTTPS_PORT = httpsPort;

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const originsString = process.env.CORS_ALLOWED_ORIGINS || '';
const origins = originsString.split(',').map((s) => s.trim()).filter(Boolean);
export const CORS_ALLOWED_ORIGINS = [...origins, FRONTEND_URL];

export const DEFAULT_PAGE_SIZE = 5;
export const DEFAULT_PAGE = 1;

// JWT & Cookie
if (!process.env.JWT_SECRET) {
  console.warn('No JWT secret set!');
}
export const JWT_SECRET = process.env.JWT_SECRET || 'not-so-secret';
export const JWT_EXPIRATION_TIME_S = parseInt(process.env.JWT_EXPIRATION_TIME_S, 10) || 60 * 60 * 24 * 10; // 10d
export const JWT_ACTIVATION_EXPIRATION_TIME_S = parseInt(process.env.JWT_EXPIRATION_TIME_S, 10) || 60 * 60 * 24 * 3; // 3d
export const JWT_PASSWORD_RESET_EXPIRATION_TIME_S = parseInt(process.env.JWT_EXPIRATION_TIME_S, 10) || 60 * 60 * 24; // 24h
export const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== 'false';
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
export const EXTEND_TOKEN_DURATION_AUTOMATICALLY = process.env.EXTEND_TOKEN_DURATION_AUTOMATICALLY !== 'false';
export const EXTEND_TOKEN_FREQUENCY_S = parseInt(process.env.EXTEND_TOKEN_FREQUENCY_S, 10) || 60 * 60; // 1h
export const EXTEND_TOKEN_REVOCATION_DELAY_S = parseInt(process.env.EXTEND_TOKEN_REVOCATION_DELAY_S, 10) || 60; // 1min
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'key-yourkeyhere';
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'js-api-onboarding.byinfinum.co';
export const MAILGUN_LOGIN = process.env.MAILGUN_LOGIN || 'postmaster@js-api-onboarding.byinfinum.co'
export const MAILGUN_SMTP = process.env.MAILGUN_SMTP || 'smtp.eu.mailgun.org'
