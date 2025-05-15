# Dockerfile for Next.js Application

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# Install libc6-compat for compatibility with some native dependencies on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and lock files
# This allows Docker to cache the dependencies layer if these files don't change
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on the detected lockfile
# This script intelligently chooses between npm, yarn, or pnpm
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found. Please commit one." && exit 1; \
  fi

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all other source files (including next.config.js)
COPY . .

# Disable Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Run the Next.js build script (defined in your package.json)
RUN npm run build

# --- DEBUGGING STEP: List contents of .next directory ---
RUN echo "Contents of /app/.next after build:" && ls -la /app/.next/
# --- END DEBUGGING STEP ---

# Stage 3: Production image
# Use a lean Node.js Alpine image for the final production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user and group for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy the standalone Next.js application output
# This includes only the necessary files to run the app, significantly reducing image size.
# Ensure 'output: "standalone"' is in your next.config.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port Next.js will run on (default is 3000)
# Render will map its internal port to this.
EXPOSE 3000

# Set the PORT environment variable that Next.js will use.
# Render provides its own $PORT, which Next.js server.js (in standalone) will pick up.
# This ENV PORT is a fallback for local Docker runs if $PORT isn't set.
ENV PORT 3000

# The command to start the Next.js server in standalone mode.
# The `server.js` file is part of the .next/standalone output.
CMD ["node", "server.js"]
