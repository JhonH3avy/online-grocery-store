FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma (Alpine 3.17+ uses openssl3 by default)
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Create necessary directories
RUN mkdir -p uploads && chmod 755 uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
