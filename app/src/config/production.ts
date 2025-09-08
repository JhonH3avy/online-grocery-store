/**
 * Production Configuration
 * 
 * Configuration specific to production environment
 */

export const prodConfig = {
  api: {
    baseUrl: '/api', // Nginx proxy in production
    timeout: 10000,
    retries: 3,
  },
  
  features: {
    analytics: true,
    debug: false,
    mockApi: false,
    hotReload: false,
  },
  
  services: {
    stripe: {
      publicKey: 'pk_live_your_production_key_here',
    },
  },
  
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true,
  },
} as const;
