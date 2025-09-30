FROM node:22-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Prisma)
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client with all required binaries for production
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies but keep prisma CLI for potential runtime needs
RUN npm prune --production && npm install prisma@$(node -p "require('./package.json').devDependencies['prisma']") @prisma/client@$(node -p "require('./package.json').dependencies['@prisma/client']")

# Ensure Prisma client is available and re-generate if needed
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Create uploads directory
RUN mkdir -p uploads

# Start the application
CMD ["npm", "start"]
