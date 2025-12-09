FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev) for build
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Prune dev dependencies for production image
RUN npm prune --omit=dev

# Create necessary directories
RUN mkdir -p uploads && chmod 755 uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
