// APP
export const SRC_DIR = __dirname;
export const ROOT_DIR = process.cwd();

// API
const httpPort = parseInt(process.env.HTTP_PORT, 10) || 8080;
export const HTTP_PORT = httpPort;

export const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not set!");
}
const originsString = process.env.CORS_ALLOWED_ORIGINS || "";
const origins = originsString
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
export const CORS_ALLOWED_ORIGINS = [...origins, FRONTEND_URL];

export const DEFAULT_PAGE_SIZE = 5;
export const DEFAULT_PAGE = 1;

// JWT & Cookie
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set!");
}
export const JWT_SECRET = process.env.JWT_SECRET || "not-so-secret";
export const JWT_EXPIRATION_TIME_S = 60 * 60 * 24 * 10; // 10d
export const JWT_ACTIVATION_EXPIRATION_TIME_S = 60 * 60 * 24 * 3; // 3d
export const JWT_PASSWORD_RESET_EXPIRATION_TIME_S = 60 * 60 * 24; // 24h
export const COOKIE_HTTP_ONLY = process.env.COOKIE_HTTP_ONLY !== "false";
export const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false";
export const EXTEND_TOKEN_DURATION_AUTOMATICALLY =
  process.env.EXTEND_TOKEN_DURATION_AUTOMATICALLY !== "false";
export const EXTEND_TOKEN_FREQUENCY_S = 60 * 60; // 1h
export const EXTEND_TOKEN_REVOCATION_DELAY_S = 60; // 1min

if (!process.env.RESEND_API_KEY) {
  console.warn("No RESEND_API_KEY set!");
}
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
