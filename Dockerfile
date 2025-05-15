# Dockerfile for Next.js Application

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# Install libc6-compat for compatibility with some native dependencies on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found. Please commit one." && exit 1; \
  fi

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . . # Copy all source files, including next.config.js

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# --- DEBUGGING STEP: Print contents of next.config.js ---
RUN echo "Contents of /app/next.config.js during build:" && cat /app/next.config.js && echo "\n--- End of next.config.js ---"
# --- END DEBUGGING STEP ---

RUN npm run build

# --- DEBUGGING STEP: List contents of .next directory ---
RUN echo "Contents of /app/.next after build:" && ls -la /app/.next/
# --- END DEBUGGING STEP ---

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
