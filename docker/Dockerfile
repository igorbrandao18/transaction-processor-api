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

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci

# Copy application source code
# In production (CI/CD), app.tar.gz is provided
# In development, copy files directly
ARG BUILD_MODE=development
COPY app.tar.gz* ./
RUN if [ -f app.tar.gz ]; then \
      echo "Extracting app.tar.gz (production mode)..." && \
      tar -xzf app.tar.gz && rm app.tar.gz; \
    else \
      echo "Copying source files directly (development mode)..." && \
      echo "Note: Source files should be copied via docker-compose context"; \
    fi

# Copy source files if not using tar.gz (development mode)
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client and build TypeScript
RUN npx prisma generate && npm run build && echo "Build completed, checking dist..." && ls -la dist/ && test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found!" && find . -name "main.js" 2>/dev/null && exit 1)

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
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/prisma.config.ts ./
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/src/main.js"]

