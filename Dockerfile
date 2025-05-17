# ───────────────────────────────────────────────────
#  Multi-stage Next.js build for rok-ai.com
# ───────────────────────────────────────────────────

# 1) Install and build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfile and manifest
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# 2) Run in a slim container
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built app + dependencies
COPY --from=builder /app . 

# Expose port (optional, Render picks  env)
EXPOSE 3000

# Health check is served via Next.js API
CMD ["npm", "run", "start"]
