/**
 * Development Configuration
 * 
 * Configuration specific to development environment
 */

export const devConfig = {
  api: {
    baseUrl: 'http://localhost:5000/api',
    timeout: 30000, // Longer timeout for development debugging
    retries: 1, // Fewer retries in development
  },
  
  features: {
    analytics: false,
    debug: true,
    mockApi: false,
    hotReload: true,
  },
  
  services: {
    stripe: {
      publicKey: 'pk_test_your_development_key_here',
    },
  },
  
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
} as const;
