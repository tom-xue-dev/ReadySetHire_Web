/**
 * API Configuration (Vite + TypeScript)
 * --------------------------------------
 * Centralized configuration for API endpoints.
 * Automatically reads environment variables
 * and supports development / staging / production modes.
 */

export interface ApiConfig {
    baseUrl: string;
    apiLogs: boolean;
}
  
// Default fallback configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: "http://localhost:3000/api",
  apiLogs: true,
};

// Helper: read env vars with fallback
const env = import.meta.env;

function getEnv<T>(key: keyof ImportMetaEnv, fallback: T): T {
  const raw = env[key];
  if (raw === undefined || raw === null) return fallback;
  return raw as unknown as T;
}


export const ENV_MODE = env.MODE || "development";

export const CONFIG_BY_ENV: Record<string, ApiConfig> = {
  development: {
    ...DEFAULT_CONFIG,
    baseUrl: getEnv("VITE_API_BASE_URL", DEFAULT_CONFIG.baseUrl),
    apiLogs: getEnv("VITE_API_LOGS", DEFAULT_CONFIG.apiLogs),
  },

  production: {
    ...DEFAULT_CONFIG,
    baseUrl: getEnv("VITE_API_BASE_URL", DEFAULT_CONFIG.baseUrl),
    apiLogs: getEnv("VITE_API_LOGS", DEFAULT_CONFIG.apiLogs),
  },

};

export const apiConfig: ApiConfig = CONFIG_BY_ENV[ENV_MODE] ?? CONFIG_BY_ENV["development"];

export const API_BASE_URL = apiConfig.baseUrl;


export function logEnvironmentInfo() {
  console.log("🚀 ReadySetHire Environment Loaded");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🌍 Mode: ${ENV_MODE}`);
  console.log(`🔗 API URL: ${apiConfig.baseUrl}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}
