# Multi-stage Dockerfile for Family Jeopardy on Raspberry Pi (ARM64 / ARMv7 / AMD64)
# Stage 1: Build the Vite production frontend
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production runtime with Node.js Express server for AI & Wi-Fi Sync
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
# Install production and runner dependencies
RUN npm install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/images ./images
COPY --from=builder /app/tsconfig.json ./tsconfig.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
