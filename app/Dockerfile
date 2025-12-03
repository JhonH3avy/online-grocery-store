# Multi-stage build for React app
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL=http://localhost:5000/api
ARG VITE_APP_NAME="Online Grocery Store"
ARG VITE_APP_VERSION=1.0.0
ARG VITE_ENABLE_ANALYTICS=false
ARG VITE_ENABLE_DEBUG=false

# Set environment variables for the build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS
ENV VITE_ENABLE_DEBUG=$VITE_ENABLE_DEBUG

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built app to nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration (we'll create this)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
