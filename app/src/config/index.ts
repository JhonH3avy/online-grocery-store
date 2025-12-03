/**
 * Application Configuration
 * 
 * Centralized configuration management using Vite environment variables.
 * All client-side environment variables must be prefixed with VITE_
 */

// Environment Detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// API Configuration
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  retries: 3,
} as const;

// Application Configuration
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Online Grocery Store',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  title: import.meta.env.VITE_APP_NAME || 'Online Grocery Store',
} as const;

// Feature Flags
export const features = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  maintenance: import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  // Always use API data - removed useApiData flag since API is now the source of truth
} as const;

// External Services Configuration
export const services = {
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  },
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  },
} as const;

// Development Tools
export const devConfig = {
  showConsoleWarnings: isDevelopment && features.debug,
  enableReduxDevTools: isDevelopment,
  mockApi: import.meta.env.VITE_MOCK_API === 'true',
} as const;

// Validation: Check required environment variables
const requiredEnvVars = [
  'VITE_API_BASE_URL',
] as const;

if (isProduction) {
  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
    }
  });
}

// Export all configurations
export const config = {
  api: apiConfig,
  app: appConfig,
  features,
  services,
  dev: devConfig,
  env: {
    isDevelopment,
    isProduction,
    mode,
  },
} as const;

export default config;
