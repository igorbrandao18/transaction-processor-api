# Multi-stage build for optimization

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and config files
COPY . .
COPY tsconfig.json nest-cli.json ./

# Build TypeScript
RUN npm run build && echo "Build completed, checking dist..." && ls -la . && if [ -d "dist" ]; then ls -la dist/; else echo "dist directory not found!"; fi && test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && find . -name "main.js" 2>/dev/null && exit 1)

# Stage 3: Production
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./
COPY --from=build --chown=nestjs:nodejs /app/migrations ./migrations

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]

